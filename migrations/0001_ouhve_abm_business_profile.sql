-- OUHVE ABM — Module 1: Business Profile extension
-- Adds AI-operation-base fields to franchises (wellness center identity)
-- All columns nullable for backward compat with existing GLFAV records

ALTER TABLE franchises ADD COLUMN IF NOT EXISTS wellness_category TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS operating_hours JSONB;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS main_programs TEXT[];
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS primary_audience TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS philosophy TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS top_concern TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP;
