-- ============================================================
-- Migration 007 : Demandes de suppression de compte
-- Date        : 2026-02-26
-- Description : Workflow d'approbation manager pour supprimer un compte
-- ============================================================

CREATE TABLE IF NOT EXISTS deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  note          TEXT,
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID        REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_del_req_user       ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_del_req_restaurant ON deletion_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_del_req_status     ON deletion_requests(status);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User sees own request"     ON deletion_requests;
DROP POLICY IF EXISTS "Manager sees restaurant"   ON deletion_requests;
DROP POLICY IF EXISTS "Allow insert service role" ON deletion_requests;

CREATE POLICY "User sees own request" ON deletion_requests
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

CREATE POLICY "Manager sees restaurant" ON deletion_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_restaurants ur
      WHERE ur.user_id::TEXT  = auth.uid()::TEXT
        AND ur.restaurant_id  = deletion_requests.restaurant_id
        AND ur.role           = 'manager'
    )
  );

CREATE POLICY "Allow insert service role" ON deletion_requests
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow update service role" ON deletion_requests
  FOR UPDATE USING (TRUE);
