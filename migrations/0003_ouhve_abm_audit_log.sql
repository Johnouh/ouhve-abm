-- OUHVE ABM — Cycle 16 (AssistFit GAP-29): 감사로그
-- 회원·결제·이용권 등 핵심 데이터 변경 이력 추적

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  changes_json JSONB,
  performed_by TEXT,
  performed_by_role TEXT,
  ip_address TEXT,
  reason TEXT,
  franchise_id INTEGER REFERENCES franchises(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_franchise_created ON audit_logs(franchise_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(franchise_id, performed_by, created_at DESC) WHERE performed_by IS NOT NULL;
