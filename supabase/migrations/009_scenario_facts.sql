-- Add structured inspection-context facts to scenarios.
-- These are optional JSONB fields that override regex-based fact extraction
-- from risk text when set. NULL means regex fallback is used (backward compatible).
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS scenario_facts JSONB DEFAULT NULL;
