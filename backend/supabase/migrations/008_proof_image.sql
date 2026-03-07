-- ============================================================
-- Migration 008 : Ajout de la preuve photo aux rapports
-- Date        : 2026-03-06
-- Description : Colonne proof_image_base64 pour stocker la photo
--               jointe optionnellement lors du cash out
-- ============================================================

-- Ajout de la colonne pour stocker l'image en base64
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS proof_image_base64 TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by_manager_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS submitted_for_employee_id UUID REFERENCES users(id);

-- Index sur la colonne de recherche par mois (optimise le filtre par mois)
CREATE INDEX IF NOT EXISTS idx_reports_created_month
  ON reports (DATE_TRUNC('month', created_at));

-- Index sur submitted_for_employee pour les rapports soumis par manager
CREATE INDEX IF NOT EXISTS idx_reports_submitted_for
  ON reports (submitted_for_employee_id)
  WHERE submitted_for_employee_id IS NOT NULL;
