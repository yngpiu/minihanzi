-- Migration 00003: Add structured JSONB columns for radical tree and example data

ALTER TABLE words ADD COLUMN IF NOT EXISTS radical_components JSONB DEFAULT '[]'::jsonb;
ALTER TABLE words ADD COLUMN IF NOT EXISTS example_data JSONB;
