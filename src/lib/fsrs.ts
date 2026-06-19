import { createEmptyCard, type Card as FSRSCard, fsrs, Rating } from "ts-fsrs";
import type { MasterlyLevel, WordReview } from "./types";

export { Rating };
export type { FSRSCard };

export type FSRSGrade = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

const scheduler = fsrs({
	request_retention: 0.9,
	maximum_interval: 36500,
	enable_fuzz: true,
	enable_short_term: true,
	learning_steps: ["1m", "10m"],
	relearning_steps: ["10m"],
});

export function createDefaultCard(): FSRSCard {
	return createEmptyCard();
}

export function dbToCard(review: WordReview): FSRSCard {
	return {
		due: review.next_review_at ? new Date(review.next_review_at) : new Date(),
		stability: review.stability ?? 0,
		difficulty: review.difficulty ?? 0,
		elapsed_days: review.elapsed_days ?? 0,
		scheduled_days: review.scheduled_days ?? 0,
		reps: review.total_reviews ?? 0,
		lapses: review.lapses ?? 0,
		state: review.state ?? 0,
		last_review: review.last_reviewed
			? new Date(review.last_reviewed)
			: undefined,
	};
}

export function cardToDb(card: FSRSCard): Partial<WordReview> {
	return {
		stability: card.stability ?? 0,
		difficulty: card.difficulty ?? 0,
		elapsed_days: card.elapsed_days ?? 0,
		scheduled_days: card.scheduled_days ?? 0,
		total_reviews: card.reps ?? 0,
		lapses: card.lapses ?? 0,
		state: card.state ?? 0,
		last_reviewed: card.last_review ? card.last_review.toISOString() : null,
		next_review_at: card.due
			? card.due.toISOString()
			: new Date().toISOString(),
	};
}

export function gradeCard(
	card: FSRSCard,
	rating: FSRSGrade,
	now: Date = new Date(),
): { card: FSRSCard; log: unknown } {
	const result = scheduler.next(card, now, rating);
	return {
		card: result.card,
		log: result.log,
	};
}

export function getRetrievability(
	card: FSRSCard,
	now: Date = new Date(),
): number {
	return scheduler.get_retrievability(card, now);
}

export function reviewToMasteryLevel(review: WordReview | null): MasterlyLevel {
	if (!review) return "unstudied";
	const card = dbToCard(review);
	return getMasteryLevel(card);
}

export function getMasteryLevel(card: FSRSCard): MasterlyLevel {
	const r = getRetrievability(card);

	if (card.state === 0) return "unstudied";
	if (card.state === 1 || card.state === 3) return "learning";
	if (card.reps === 0) return "unstudied";
	if (r < 0.7) return "reviewing";
	if (r < 0.9) return "familiar";
	return "mastered";
}

export function getMasteryInfo(level: MasterlyLevel): {
	label: string;
	variant: "default" | "secondary" | "destructive" | "outline";
} {
	switch (level) {
		case "unstudied":
			return { label: "Chưa học", variant: "outline" };
		case "learning":
			return { label: "Đang học", variant: "destructive" };
		case "reviewing":
			return { label: "Cần ôn", variant: "secondary" };
		case "familiar":
			return { label: "Quen", variant: "default" };
		case "mastered":
			return { label: "Đã thuộc", variant: "outline" };
	}
}

const RATING_LABELS: Record<number, string> = {
	[Rating.Again]: "Quên",
	[Rating.Hard]: "Khó",
	[Rating.Good]: "Tốt",
	[Rating.Easy]: "Dễ",
};

const RATING_COLORS: Record<
	number,
	{ bg: string; hover: string; ring: string; text: string }
> = {
	[Rating.Again]: {
		bg: "bg-red-600",
		hover: "hover:bg-red-700",
		ring: "ring-red-400",
		text: "text-red-100",
	},
	[Rating.Hard]: {
		bg: "bg-orange-600",
		hover: "hover:bg-orange-700",
		ring: "ring-orange-400",
		text: "text-orange-100",
	},
	[Rating.Good]: {
		bg: "bg-blue-600",
		hover: "hover:bg-blue-700",
		ring: "ring-blue-400",
		text: "text-blue-100",
	},
	[Rating.Easy]: {
		bg: "bg-green-600",
		hover: "hover:bg-green-700",
		ring: "ring-green-400",
		text: "text-green-100",
	},
};

export function getRatingLabel(rating: FSRSGrade): string {
	return RATING_LABELS[rating];
}

export function getRatingColors(rating: FSRSGrade) {
	return RATING_COLORS[rating];
}

export function getRatingKey(rating: FSRSGrade): string {
	switch (rating) {
		case Rating.Again:
			return "1";
		case Rating.Hard:
			return "2";
		case Rating.Good:
			return "3";
		case Rating.Easy:
			return "4";
	}
}

export function getRatingFromKey(key: string): FSRSGrade | null {
	switch (key) {
		case "1":
			return Rating.Again as FSRSGrade;
		case "2":
			return Rating.Hard as FSRSGrade;
		case "3":
			return Rating.Good as FSRSGrade;
		case "4":
			return Rating.Easy as FSRSGrade;
		default:
			return null;
	}
}
