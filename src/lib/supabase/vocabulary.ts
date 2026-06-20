import { supabase } from "./client";

export interface VocabPath {
	id: number;
	title: string;
	tags: string;
}

export interface VocabStudySet {
	id: number;
	path_id: number;
	title: string;
	word_count: number;
	words: VocabWord[];
}

export interface VocabWord {
	id: number;
	set_id: number;
	hanzi: string;
	pinyin: string;
	vietnamese: string;
	type: string;
	example: string;
	synonyms: string[];
}

export interface PhoneticCell {
	id: number;
	row_idx: number;
	col_idx: number;
	text: string[];
	type: number;
	audio: (string | null)[];
	join_text: string;
	original_id: string;
	filename: string;
	is_null: boolean;
}

export async function fetchPaths(): Promise<VocabPath[]> {
	const { data, error } = await supabase
		.from("paths")
		.select("id, title, tags")
		.order("id");

	if (error) throw error;
	return data ?? [];
}

export async function fetchStudySet(
	setId: number,
): Promise<VocabStudySet | null> {
	const { data: setData, error: setError } = await supabase
		.from("study_sets")
		.select("id, path_id, title, word_count")
		.eq("id", setId)
		.single();

	if (setError || !setData) return null;

	const { data: words, error: wordsError } = await supabase
		.from("vocabulary")
		.select("id, set_id, hanzi, pinyin, vietnamese, type, example, synonyms")
		.eq("set_id", setId)
		.order("id");

	if (wordsError) throw wordsError;

	return {
		...setData,
		words: words ?? [],
	};
}

export async function fetchPathsWithSets(): Promise<
	(VocabPath & { study_sets: VocabStudySet[] })[]
> {
	const { data, error } = await supabase
		.from("paths")
		.select("id, title, tags, study_sets (id, path_id, title, word_count)")
		.order("id");

	if (error) throw error;

	return (data ?? []).map((p) => ({
		id: p.id,
		title: p.title,
		tags: p.tags,
		study_sets: ((p as { study_sets: VocabStudySet[] }).study_sets ?? []).map(
			(s) => ({ ...s, words: [] }),
		),
	}));
}

export async function searchVocabulary(query: string): Promise<VocabWord[]> {
	if (!query.trim()) return [];

	const { data, error } = await supabase
		.from("vocabulary")
		.select("id, set_id, hanzi, pinyin, vietnamese, type, example, synonyms")
		.or(
			`hanzi.ilike.%${query}%,pinyin.ilike.%${query}%,vietnamese.ilike.%${query}%`,
		)
		.limit(50);

	if (error) throw error;

	const seen = new Set<string>();
	return (data ?? []).filter((w) => {
		const key = w.hanzi;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export async function fetchPhonetic(): Promise<PhoneticCell[]> {
	const { data, error } = await supabase
		.from("phonetic")
		.select("*")
		.order("row_idx")
		.order("col_idx");

	if (error) throw error;
	return data ?? [];
}
