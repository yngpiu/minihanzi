import { useQuery } from "@tanstack/react-query";
import type { Card } from "ts-fsrs";
import { supabase } from "./client";

export interface SRSRow {
	id?: number;
	study_set_id: number;
	hanzi: string;
	due: string;
	stability: number;
	difficulty: number;
	elapsed_days: number;
	scheduled_days: number;
	reps: number;
	lapses: number;
	state: number;
	last_review: string | null;
	created_at?: string;
	updated_at?: string;
}

function cardToRow(studySetId: number, hanzi: string, card: Card): SRSRow {
	return {
		study_set_id: studySetId,
		hanzi,
		due: new Date(card.due).toISOString(),
		stability: card.stability,
		difficulty: card.difficulty,
		elapsed_days: card.elapsed_days,
		scheduled_days: card.scheduled_days,
		reps: card.reps,
		lapses: card.lapses,
		state: card.state,
		last_review: card.last_review
			? new Date(card.last_review).toISOString()
			: null,
	};
}

function rowToCard(row: SRSRow): Card {
	return {
		due: new Date(row.due),
		stability: row.stability,
		difficulty: row.difficulty,
		elapsed_days: row.elapsed_days,
		scheduled_days: row.scheduled_days,
		reps: row.reps,
		lapses: row.lapses,
		state: row.state as Card["state"],
		last_review: row.last_review ? new Date(row.last_review) : null,
	};
}

export async function getSRSCards(
	studySetId: number,
): Promise<Map<string, Card>> {
	const { data, error } = await supabase
		.from("srs_cards")
		.select("*")
		.eq("study_set_id", studySetId);

	if (error) {
		console.error("Failed to load SRS cards:", error);
		return new Map();
	}

	const map = new Map<string, Card>();
	for (const row of data ?? []) {
		map.set(row.hanzi, rowToCard(row));
	}
	return map;
}

export async function saveSRSCard(
	studySetId: number,
	hanzi: string,
	card: Card,
): Promise<void> {
	const row = cardToRow(studySetId, hanzi, card);
	const { error } = await supabase.from("srs_cards").upsert(row, {
		onConflict: "study_set_id, hanzi",
		ignoreDuplicates: false,
	});

	if (error) {
		console.error("Failed to save SRS card:", error);
	}
}

export async function saveAllSRSCards(
	studySetId: number,
	cards: Array<{ hanzi: string; card: Card }>,
): Promise<void> {
	const rows = cards.map(({ hanzi, card }) =>
		cardToRow(studySetId, hanzi, card),
	);

	const { error } = await supabase.from("srs_cards").upsert(rows, {
		onConflict: "study_set_id, hanzi",
		ignoreDuplicates: false,
	});

	if (error) {
		console.error("Failed to save all SRS cards:", error);
	}
}

export async function fetchSRSStats(): Promise<{
	total: number;
	due: number;
}> {
	const now = new Date().toISOString();

	const { count: total, error: totalError } = await supabase
		.from("srs_cards")
		.select("*", { count: "exact", head: true });

	const { count: due, error: dueError } = await supabase
		.from("srs_cards")
		.select("*", { count: "exact", head: true })
		.lte("due", now);

	if (totalError || dueError) {
		console.error("Failed to get SRS stats:", totalError ?? dueError);
		return { total: 0, due: 0 };
	}

	return {
		total: total ?? 0,
		due: due ?? 0,
	};
}

export function useSRSStats() {
	return useQuery({
		queryKey: ["srs", "stats"],
		queryFn: fetchSRSStats,
		refetchInterval: 30_000,
	});
}
