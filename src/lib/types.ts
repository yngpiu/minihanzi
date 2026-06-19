export interface RadicalNode {
	char: string;
	pinyin: string;
	meaning: string;
	role: string;
	children?: RadicalNode[];
}

export interface ExampleData {
	hanzi: string;
	pinyin: string;
	meaning: string;
}

export interface Word {
	id: string;
	hanzi: string;
	pinyin: string;
	meaning: string;
	radical: string | null;
	radical_components: RadicalNode[] | null;
	etymology: string | null;
	example: string | null;
	example_data: ExampleData | null;
	tags: string[];
	created_at: string;
	updated_at: string;
}

export interface WordReview {
	id: string;
	word_id: string;
	stability: number;
	difficulty: number;
	lapses: number;
	state: number;
	elapsed_days: number;
	scheduled_days: number;
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

export type InteractiveMode =
	| "pinyin-input"
	| "hanzi-choice"
	| "listen-input"
	| "mixed";

export type FSRSRating = 1 | 2 | 3 | 4;

export type ExerciseState = "prompt" | "answer" | "rated";
