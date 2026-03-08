-- ============================================================
-- Migration 009 : Périodes de Paie
-- Date        : 2026-03-07
-- Description : Table pay_periods + liaison reports/tip_distributions
--               + configuration fréquence par restaurant
-- ============================================================

-- ── 1. Configuration de la fréquence par restaurant ──────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS pay_period_frequency      VARCHAR(20)  DEFAULT 'biweekly'
    CHECK (pay_period_frequency IN ('weekly', 'biweekly')),
  ADD COLUMN IF NOT EXISTS pay_period_start_day      INTEGER      DEFAULT 1,
    -- 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
  ADD COLUMN IF NOT EXISTS pay_period_reference_date DATE;
    -- Date de référence pour calculer les cycles bi-hebdomadaires

-- ── 2. Table principale des périodes de paie ─────────────────
CREATE TABLE IF NOT EXISTS pay_periods (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  start_date    DATE         NOT NULL,
  end_date      DATE         NOT NULL,
  status        VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  closed_at     TIMESTAMPTZ,
  closed_by     UUID         REFERENCES users(id),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_periods_restaurant
  ON pay_periods(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_pay_periods_dates
  ON pay_periods(restaurant_id, start_date, end_date);

-- ── 3. Lier les rapports à une période de paie ───────────────
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS pay_period_id UUID REFERENCES pay_periods(id);

CREATE INDEX IF NOT EXISTS idx_reports_pay_period
  ON reports(pay_period_id);

-- ── 4. Lier les distributions de tips à une période ──────────
ALTER TABLE tip_distributions
  ADD COLUMN IF NOT EXISTS pay_period_id UUID REFERENCES pay_periods(id);

CREATE INDEX IF NOT EXISTS idx_tipdist_pay_period
  ON tip_distributions(pay_period_id);

-- ── 5. Row Level Security pour pay_periods ───────────────────
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members see restaurant periods" ON pay_periods;
DROP POLICY IF EXISTS "Managers manage periods"        ON pay_periods;
DROP POLICY IF EXISTS "Allow service role"             ON pay_periods;

-- Tous les membres du restaurant peuvent voir les périodes
CREATE POLICY "Members see restaurant periods" ON pay_periods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_restaurants ur
      WHERE ur.user_id::TEXT      = auth.uid()::TEXT
        AND ur.restaurant_id      = pay_periods.restaurant_id
    )
  );

-- Le service role (backend) a accès complet
CREATE POLICY "Allow service role" ON pay_periods
  FOR ALL WITH CHECK (TRUE);
