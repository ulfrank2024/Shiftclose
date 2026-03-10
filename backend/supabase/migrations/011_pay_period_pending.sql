-- ────────────────────────────────────────────────────────────────────────────
-- Migration 011 : Ajout du statut 'pending' pour les périodes de paie planifiées
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Supprimer l'ancienne contrainte CHECK
ALTER TABLE pay_periods
  DROP CONSTRAINT IF EXISTS pay_periods_status_check;

-- 2. Ajouter la nouvelle contrainte avec 'pending'
ALTER TABLE pay_periods
  ADD CONSTRAINT pay_periods_status_check
  CHECK (status IN ('pending', 'active', 'closed'));

-- 3. Mettre à jour la valeur par défaut
ALTER TABLE pay_periods
  ALTER COLUMN status SET DEFAULT 'pending';
