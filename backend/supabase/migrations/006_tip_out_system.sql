-- ============================================================
-- Migration 006 : Système de Tip-Out complet avec distributions
-- Date        : 2026-02-26
-- Description : Étend reports + crée tip_distributions + permissions
-- ============================================================

-- ── 1. Nouvelles colonnes sur la table reports ───────────────
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS tip_out_breakdown   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voluntary_donations  JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meal_deductions      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cash_amount          DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_back             DECIMAL(10,2) DEFAULT 0;

-- ── 2. Table des distributions individuelles ─────────────────
--    Permet aux commis/barmans de voir les montants reçus.
CREATE TABLE IF NOT EXISTS tip_distributions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id           UUID         NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  restaurant_id       UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  from_employee_id    UUID         NOT NULL REFERENCES users(id),
  from_employee_name  TEXT         NOT NULL,
  to_employee_id      UUID         REFERENCES users(id),     -- NULL = pool cuisine (pas de personne dédiée)
  to_employee_name    TEXT         NOT NULL,
  role                TEXT         NOT NULL,                  -- 'kitchen_pool' | 'bar' | 'commis' | 'host' | 'manager' | 'donation'
  percentage          DECIMAL(5,2) DEFAULT 0,
  base_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,      -- total ventes (base de calcul)
  amount              DECIMAL(10,2) NOT NULL DEFAULT 0,      -- montant versé
  is_donation         BOOLEAN      DEFAULT FALSE,
  is_meal_deduction   BOOLEAN      DEFAULT FALSE,
  report_date         DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_tipdist_to_employee   ON tip_distributions(to_employee_id);
CREATE INDEX IF NOT EXISTS idx_tipdist_from_employee ON tip_distributions(from_employee_id);
CREATE INDEX IF NOT EXISTS idx_tipdist_restaurant    ON tip_distributions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tipdist_date          ON tip_distributions(report_date);
CREATE INDEX IF NOT EXISTS idx_tipdist_report_id     ON tip_distributions(report_id);

-- ── 3. Permission cash out par membre d'équipe ───────────────
ALTER TABLE user_restaurants
  ADD COLUMN IF NOT EXISTS can_do_cashout BOOLEAN DEFAULT TRUE;

-- ── 4. Row Level Security pour tip_distributions ─────────────
ALTER TABLE tip_distributions ENABLE ROW LEVEL SECURITY;

-- Nettoyage pour idempotence
DROP POLICY IF EXISTS "Users see own distributions"   ON tip_distributions;
DROP POLICY IF EXISTS "Managers see restaurant dists" ON tip_distributions;
DROP POLICY IF EXISTS "Allow insert for service role" ON tip_distributions;

-- Chaque utilisateur voit les distributions où il est donneur ou receveur
CREATE POLICY "Users see own distributions" ON tip_distributions
  FOR SELECT USING (
    from_employee_id::TEXT = auth.uid()::TEXT
    OR to_employee_id::TEXT = auth.uid()::TEXT
  );

-- Managers voient toutes les distributions de leur restaurant
CREATE POLICY "Managers see restaurant dists" ON tip_distributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_restaurants ur
      WHERE ur.user_id::TEXT   = auth.uid()::TEXT
        AND ur.restaurant_id   = tip_distributions.restaurant_id
        AND ur.role            = 'manager'
    )
  );

-- Le service role (backend) peut insérer
CREATE POLICY "Allow insert for service role" ON tip_distributions
  FOR INSERT WITH CHECK (TRUE);
