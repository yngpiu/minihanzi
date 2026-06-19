import {
	cardToDb,
	createDefaultCard,
	dbToCard,
	type FSRSCard,
	type FSRSGrade,
	gradeCard,
} from "@/lib/fsrs";
import type {
	DashboardStats,
	ExampleData,
	RadicalNode,
	StudyLog,
	UserSettings,
	Word,
	WordReview,
	WordWithReview,
} from "@/lib/types";
import { supabaseClient } from "./client";

function throwOnError(
	label: string,
	result: { error?: unknown; data?: unknown },
) {
	if (result.error) {
		const msg =
			typeof result.error === "object" && result.error !== null
				? String((result.error as { message?: string }).message ?? result.error)
				: String(result.error);
		throw new Error(`Supabase [${label}]: ${msg}`);
	}
}

// ─── Words ────────────────────────────────────────────

export async function getWords(): Promise<WordWithReview[]> {
	const res = await supabaseClient
		.from("words")
		.select("*, word_review:word_reviews(*)")
		.order("created_at", { ascending: false });
	throwOnError("getWords", res);
	return (res.data ?? []) as WordWithReview[];
}

export async function getWord(id: string): Promise<WordWithReview | null> {
	const res = await supabaseClient
		.from("words")
		.select("*, word_review:word_reviews(*)")
		.eq("id", id)
		.single();
	throwOnError("getWord", res);
	return res.data as WordWithReview | null;
}

export async function addWord(fields: {
	hanzi: string;
	pinyin: string;
	meaning: string;
	radical?: string;
	radical_components?: RadicalNode[];
	etymology?: string;
	example?: string;
	example_data?: ExampleData;
	tags?: string[];
}): Promise<Word> {
	const res = await supabaseClient
		.from("words")
		.insert({
			hanzi: fields.hanzi,
			pinyin: fields.pinyin,
			meaning: fields.meaning,
			radical: fields.radical ?? null,
			radical_components: fields.radical_components ?? [],
			etymology: fields.etymology ?? null,
			example: fields.example ?? null,
			example_data: fields.example_data ?? null,
			tags: fields.tags ?? [],
		})
		.select()
		.single();
	throwOnError("addWord", res);

	const word = res.data as Word;

	const card = createDefaultCard();
	const dbFields = cardToDb(card);

	const reviewRes = await supabaseClient.from("word_reviews").insert({
		word_id: word.id,
		...dbFields,
		next_review_at: new Date().toISOString(),
	});
	throwOnError("addWord:review", reviewRes);

	await upsertStudyLog(new Date().toISOString().slice(0, 10), {
		words_added: 1,
	});

	return word;
}

export async function updateWord(
	id: string,
	fields: Partial<{
		hanzi: string;
		pinyin: string;
		meaning: string;
		radical: string;
		radical_components: RadicalNode[];
		etymology: string;
		example: string;
		example_data: ExampleData;
		tags: string[];
	}>,
): Promise<Word | null> {
	const res = await supabaseClient
		.from("words")
		.update(fields)
		.eq("id", id)
		.select()
		.single();
	throwOnError("updateWord", res);
	return res.data as Word | null;
}

export async function deleteWord(id: string): Promise<void> {
	const res = await supabaseClient.from("words").delete().eq("id", id);
	throwOnError("deleteWord", res);
}

// ─── Review / FSRS ────────────────────────────────────

export async function getDueWords(): Promise<WordWithReview[]> {
	const now = new Date().toISOString();

	const { data: reviews, error: reviewsError } = await supabaseClient
		.from("word_reviews")
		.select("word_id, stability")
		.lte("next_review_at", now);
	if (reviewsError)
		throw new Error(`Supabase [getDueWords:reviews]: ${reviewsError.message}`);

	const ids = reviews?.map((r) => r.word_id) ?? [];
	if (ids.length === 0) return [];

	const { data, error } = await supabaseClient
		.from("words")
		.select("*, word_review:word_reviews(*)")
		.in("id", ids);
	if (error) throw new Error(`Supabase [getDueWords:words]: ${error.message}`);

	const words = (data ?? []) as WordWithReview[];

	words.sort((a, b) => {
		const sa = a.word_review?.stability ?? 0;
		const sb = b.word_review?.stability ?? 0;
		return sa - sb;
	});

	return words;
}

export async function reviewWord(
	wordId: string,
	grade: FSRSGrade,
): Promise<void> {
	const reviewRes = await supabaseClient
		.from("word_reviews")
		.select("*")
		.eq("word_id", wordId)
		.single();
	throwOnError("reviewWord:get", reviewRes);

	const review = reviewRes.data as WordReview;

	const card: FSRSCard = dbToCard(review);
	const { card: nextCard } = gradeCard(card, grade);
	const dbFields = cardToDb(nextCard);

	const updateRes = await supabaseClient
		.from("word_reviews")
		.update(dbFields)
		.eq("id", review.id);
	throwOnError("reviewWord:update", updateRes);

	await upsertStudyLog(new Date().toISOString().slice(0, 10), {
		words_reviewed: 1,
	});
}

// ─── Study Logs ───────────────────────────────────────

export async function getStudyLogs(days = 365): Promise<StudyLog[]> {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);
	const res = await supabaseClient
		.from("study_logs")
		.select("*")
		.gte("date", startDate.toISOString().slice(0, 10))
		.order("date", { ascending: false });
	throwOnError("getStudyLogs", res);
	return (res.data ?? []) as StudyLog[];
}

async function findStudyLog(
	date: string,
	fields = "id, words_reviewed, words_added",
) {
	const res = await supabaseClient
		.from("study_logs")
		.select(fields)
		.eq("date", date)
		.single();
	if (res.data) return res.data;
	return null;
}

export async function upsertStudyLog(
	date: string,
	delta: { words_reviewed?: number; words_added?: number },
): Promise<void> {
	const existing = await findStudyLog(date);

	if (existing) {
		const updateRes = await supabaseClient
			.from("study_logs")
			.update({
				words_reviewed: existing.words_reviewed + (delta.words_reviewed ?? 0),
				words_added: existing.words_added + (delta.words_added ?? 0),
			})
			.eq("id", existing.id);
		throwOnError("upsertStudyLog:update", updateRes);
	} else {
		const insertRes = await supabaseClient.from("study_logs").insert({
			date,
			words_reviewed: delta.words_reviewed ?? 0,
			words_added: delta.words_added ?? 0,
		});
		throwOnError("upsertStudyLog:insert", insertRes);
	}
}

export async function markTodayComplete(): Promise<void> {
	const today = new Date().toISOString().slice(0, 10);
	const existing = await findStudyLog(today, "id");

	if (existing) {
		const updateRes = await supabaseClient
			.from("study_logs")
			.update({ completed: true })
			.eq("id", existing.id);
		throwOnError("markTodayComplete:update", updateRes);
	} else {
		const insertRes = await supabaseClient.from("study_logs").insert({
			date: today,
			completed: true,
		});
		throwOnError("markTodayComplete:insert", insertRes);
	}
}

// ─── Settings ─────────────────────────────────────────

export async function getSettings(): Promise<UserSettings | null> {
	const res = await supabaseClient.from("user_settings").select("*").single();
	throwOnError("getSettings", res);
	return res.data as UserSettings | null;
}

export async function updateSettings(
	fields: Partial<{ daily_goal: number }>,
): Promise<void> {
	const findRes = await supabaseClient
		.from("user_settings")
		.select("id")
		.single();

	const existing = findRes.data;
	if (existing) {
		const updateRes = await supabaseClient
			.from("user_settings")
			.update(fields)
			.eq("id", existing.id);
		throwOnError("updateSettings:update", updateRes);
	} else {
		const insertRes = await supabaseClient.from("user_settings").insert(fields);
		throwOnError("updateSettings:insert", insertRes);
	}
}

// ─── Dashboard Stats ──────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
	const now = new Date().toISOString();
	const today = now.slice(0, 10);

	const [dueRes, totalRes, todayLogRes, logsRes] = await Promise.all([
		supabaseClient
			.from("word_reviews")
			.select("id", { count: "exact", head: true })
			.lte("next_review_at", now),
		supabaseClient.from("words").select("id", { count: "exact", head: true }),
		supabaseClient
			.from("study_logs")
			.select("*")
			.eq("date", today)
			.maybeSingle(),
		supabaseClient
			.from("study_logs")
			.select("date, completed")
			.order("date", { ascending: false })
			.limit(400),
	]);

	throwOnError("stats:due", dueRes);
	throwOnError("stats:total", totalRes);
	throwOnError("stats:logs", logsRes);

	const dueToday = dueRes.count ?? 0;
	const totalWords = totalRes.count ?? 0;
	const todayLog = todayLogRes.data as {
		words_reviewed: number;
		words_added: number;
	} | null;
	const todayReviewed = todayLog?.words_reviewed ?? 0;
	const todayAdded = todayLog?.words_added ?? 0;
	const logs = (logsRes.data ?? []) as { date: string; completed: boolean }[];

	let streak = 0;
	const todayDate = new Date();
	todayDate.setHours(0, 0, 0, 0);

	for (const log of logs) {
		if (!log.completed) break;
		const logDate = new Date(log.date);
		const diffDays = Math.round(
			(todayDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (diffDays === streak) {
			streak++;
		} else {
			break;
		}
	}

	return { dueToday, streak, totalWords, todayReviewed, todayAdded };
}
