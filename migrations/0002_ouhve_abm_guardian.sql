-- OUHVE ABM — GAP-13 (AssistFit 흡수): 보호자 등록 + 출석 푸시
-- 키즈/청소년 회원의 보호자 매핑 + 출석 시 보호자 알림 옵션

ALTER TABLE members ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS guardian_relation TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS attendance_push_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_members_guardian_push ON members(franchise_id, attendance_push_enabled) WHERE attendance_push_enabled = TRUE;
