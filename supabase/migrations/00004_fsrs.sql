-- Migration 00004: Upgrade word_reviews for FSRS v6 algorithm
-- Replaces simple interval_level with full FSRS memory parameters

ALTER TABLE word_reviews ADD COLUMN IF NOT EXISTS stability REAL NOT NULL DEFAULT 0;
ALTER TABLE word_reviews ADD COLUMN IF NOT EXISTS difficulty REAL NOT NULL DEFAULT 0;
ALTER TABLE word_reviews ADD COLUMN IF NOT EXISTS lapses INT NOT NULL DEFAULT 0;
ALTER TABLE word_reviews ADD COLUMN IF NOT EXISTS state INT NOT NULL DEFAULT 0;
ALTER TABLE word_reviews ADD COLUMN IF NOT EXISTS elapsed_days INT NOT NULL DEFAULT 0;
ALTER TABLE word_reviews ADD COLUMN IF NOT EXISTS scheduled_days INT NOT NULL DEFAULT 0;

-- Backfill existing data: convert old interval_level to FSRS state
-- total_reviews > 0 → Review(2), else New(0)
UPDATE word_reviews
SET
	state = CASE WHEN total_reviews > 0 THEN 2 ELSE 0 END,
	stability = CASE WHEN total_reviews > 0 THEN GREATEST(interval_level, 0.1) ELSE 0 END,
	difficulty = 0,
	elapsed_days = CASE
		WHEN last_reviewed IS NOT NULL THEN
			GREATEST(0, (EXTRACT(EPOCH FROM now() - last_reviewed) / 86400)::INT)
		ELSE 0
	END,
	scheduled_days = CASE WHEN total_reviews > 0 THEN GREATEST(interval_level, 1) ELSE 0 END;

ALTER TABLE word_reviews DROP COLUMN IF EXISTS interval_level;

-- Update the updated_at trigger to fire on these new columns too (already covered)
