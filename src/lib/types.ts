export interface Word {
	id: string;
	hanzi: string;
	pinyin: string;
	meaning: string;
	radical: string | null;
	etymology: string | null;
	example: string | null;
	tags: string[];
	created_at: string;
	updated_at: string;
}

export interface WordReview {
	id: string;
	word_id: string;
	interval_level: number;
	last_reviewed: string | null;
	next_review_at: string;
	total_reviews: number;
	created_at: string;
	updated_at: string;
}

export interface WordWithReview extends Word {
	word_review: WordReview | null;
}

export interface StudyLog {
	id: string;
	date: string;
	words_reviewed: number;
	words_added: number;
	completed: boolean;
	created_at: string;
}

export interface UserSettings {
	id: string;
	daily_goal: number;
	created_at: string;
	updated_at: string;
}

export type MasteryLevel =
	| "unstudied"
	| "learning"
	| "reviewing"
	| "familiar"
	| "mastered";

export interface DashboardStats {
	dueToday: number;
	streak: number;
	totalWords: number;
	todayReviewed: number;
	todayAdded: number;
}
