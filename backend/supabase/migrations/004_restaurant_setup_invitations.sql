-- ShiftClose Database Migration
-- 004: Restaurant Setup Invitations (Super Admin → New Restaurant)
-- Date: 2026-02-24

-- ===========================================
-- TABLE: restaurant_setup_invitations
-- Invitations envoyées par le Super Admin pour
-- qu'un manager crée son compte + restaurant
-- ===========================================
CREATE TABLE IF NOT EXISTS restaurant_setup_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  restaurant_name VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_by_name VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_setup_invitations_token
  ON restaurant_setup_invitations(token);

CREATE INDEX IF NOT EXISTS idx_setup_invitations_email
  ON restaurant_setup_invitations(email);

CREATE INDEX IF NOT EXISTS idx_setup_invitations_status
  ON restaurant_setup_invitations(status);
