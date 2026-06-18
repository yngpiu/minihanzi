-- Migration 00001: Initialize core tables for Chinese vocabulary learning SRS system

-- Words table: stores vocabulary entries
CREATE TABLE IF NOT EXISTS words (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	hanzi TEXT NOT NULL,
	pinyin TEXT NOT NULL,
	meaning TEXT NOT NULL,
	radical TEXT,
	etymology TEXT,
	example TEXT,
	tags TEXT[] DEFAULT '{}',
	created_at TIMESTAMPTZ DEFAULT now(),
	updated_at TIMESTAMPTZ DEFAULT now()
);

-- Word reviews table: SRS (Spaced Repetition System) state for each word
CREATE TABLE IF NOT EXISTS word_reviews (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
	interval_level INT DEFAULT 0,
	last_reviewed TIMESTAMPTZ,
	next_review_at TIMESTAMPTZ DEFAULT now(),
	total_reviews INT DEFAULT 0,
	created_at TIMESTAMPTZ DEFAULT now(),
	updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient "due words" queries
CREATE INDEX IF NOT EXISTS idx_word_reviews_next_review
	ON word_reviews (next_review_at ASC)
	WHERE next_review_at IS NOT NULL;

-- Study logs table: daily activity tracking for streak calculation
CREATE TABLE IF NOT EXISTS study_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	date DATE NOT NULL DEFAULT CURRENT_DATE,
	words_reviewed INT DEFAULT 0,
	words_added INT DEFAULT 0,
	completed BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMPTZ DEFAULT now(),
	UNIQUE(date)
);

-- User settings table: single-row configuration
CREATE TABLE IF NOT EXISTS user_settings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	daily_goal INT DEFAULT 10,
	created_at TIMESTAMPTZ DEFAULT now(),
	updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings row
INSERT INTO user_settings (daily_goal)
VALUES (10)
ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_words_updated_at
	BEFORE UPDATE ON words
	FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_word_reviews_updated_at
	BEFORE UPDATE ON word_reviews
	FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_settings_updated_at
	BEFORE UPDATE ON user_settings
	FOR EACH ROW EXECUTE FUNCTION update_updated_at();
