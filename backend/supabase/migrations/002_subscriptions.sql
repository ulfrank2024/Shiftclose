-- ShiftClose Database Schema
-- Migration: Subscriptions System
-- Date: 2026-02-05

-- ===========================================
-- SUBSCRIPTION PLANS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  max_employees INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, price, max_employees, features) VALUES
  ('starter', 'Starter', 49.00, 5, '["cash_out", "basic_reports"]'::jsonb),
  ('pro', 'Pro', 99.00, 20, '["cash_out", "advanced_reports", "team_management", "tip_out_config"]'::jsonb),
  ('enterprise', 'Enterprise', 199.00, -1, '["cash_out", "advanced_reports", "team_management", "tip_out_config", "api_access", "priority_support"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- SUBSCRIPTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ===========================================
-- ADD SUBSCRIPTION FIELDS TO RESTAURANTS
-- ===========================================
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 0;

-- ===========================================
-- FUNCTION: Update restaurant employee count
-- ===========================================
CREATE OR REPLACE FUNCTION update_restaurant_employee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE restaurants
    SET employee_count = (
      SELECT COUNT(*) FROM user_restaurants WHERE restaurant_id = NEW.restaurant_id
    )
    WHERE id = NEW.restaurant_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE restaurants
    SET employee_count = (
      SELECT COUNT(*) FROM user_restaurants WHERE restaurant_id = OLD.restaurant_id
    )
    WHERE id = OLD.restaurant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employee count
DROP TRIGGER IF EXISTS trigger_update_employee_count ON user_restaurants;
CREATE TRIGGER trigger_update_employee_count
AFTER INSERT OR DELETE ON user_restaurants
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_employee_count();

-- ===========================================
-- FUNCTION: Auto-create trial subscription for new restaurants
-- ===========================================
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  starter_plan_id UUID;
BEGIN
  -- Get starter plan ID
  SELECT id INTO starter_plan_id FROM subscription_plans WHERE name = 'starter' LIMIT 1;

  -- Create trial subscription
  INSERT INTO subscriptions (restaurant_id, plan_id, status)
  VALUES (NEW.id, starter_plan_id, 'trial');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating subscriptions
DROP TRIGGER IF EXISTS trigger_create_trial ON restaurants;
CREATE TRIGGER trigger_create_trial
AFTER INSERT ON restaurants
FOR EACH ROW
EXECUTE FUNCTION create_trial_subscription();
