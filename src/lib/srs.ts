import type { MasteryLevel } from "./types";

export type SRSGrade = 0 | 1 | 2;

export interface SRSResult {
	intervalLevel: number;
	nextReviewAt: Date;
	lastReviewed: Date;
}

export function applySRSGrade(
	grade: SRSGrade,
	currentLevel: number,
): SRSResult {
	const now = new Date();

	switch (grade) {
		case 0:
			return {
				intervalLevel: 0,
				nextReviewAt: new Date(now.getTime() + 10 * 60 * 1000),
				lastReviewed: now,
			};
		case 1:
			return {
				intervalLevel: 1,
				nextReviewAt: new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() + 1,
				),
				lastReviewed: now,
			};
		case 2:
			return {
				intervalLevel: currentLevel + 1,
				nextReviewAt: new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() + 4,
				),
				lastReviewed: now,
			};
	}
}

export function getMasteryLevel(
	intervalLevel: number,
	totalReviews: number,
): MasteryLevel {
	if (totalReviews === 0) return "unstudied";
	if (intervalLevel === 0) return "learning";
	if (intervalLevel <= 3) return "reviewing";
	if (intervalLevel <= 7) return "familiar";
	return "mastered";
}

export function getMasteryInfo(level: MasteryLevel): {
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
