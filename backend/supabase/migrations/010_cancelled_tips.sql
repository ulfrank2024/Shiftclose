-- Migration 010: Statut annulation sur tip_distributions
-- Permet de marquer des distributions comme annulées sans les supprimer,
-- conserver l'historique et notifier les employés concernés.

ALTER TABLE tip_distributions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled')),
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tipdist_status ON tip_distributions(status);

-- Tous les enregistrements existants restent 'active'
UPDATE tip_distributions SET status = 'active' WHERE status IS NULL;
