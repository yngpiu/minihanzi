import { supabase } from "./client";

export interface VocabExample {
	hanzi: string;
	pinyin: string;
	meaning: string;
}

export interface VocabMeaning {
	meaning: string;
	example: VocabExample;
}

export interface VocabCompound {
	hanzi: string;
	pinyin: string;
	meaning: string;
	examples: VocabExample[];
}

export interface VocabEntry {
	id: number;
	hanzi: string;
	pinyin: string;
	meanings: VocabMeaning[];
	compounds: VocabCompound[];
	created_at: string;
	updated_at: string;
}

export async function fetchAllEntries(): Promise<VocabEntry[]> {
	const { data, error } = await supabase
		.from("vocabulary_entries")
		.select("*")
		.order("id", { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export async function createEntry(
	entry: Pick<VocabEntry, "hanzi" | "pinyin" | "meanings" | "compounds">,
): Promise<VocabEntry> {
	const { data, error } = await supabase
		.from("vocabulary_entries")
		.insert({
			hanzi: entry.hanzi,
			pinyin: entry.pinyin,
			meanings: entry.meanings ?? [],
			compounds: entry.compounds ?? [],
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function updateEntry(
	id: number,
	updates: Partial<
		Pick<VocabEntry, "hanzi" | "pinyin" | "meanings" | "compounds">
	>,
): Promise<VocabEntry> {
	const { data, error } = await supabase
		.from("vocabulary_entries")
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function deleteEntry(id: number): Promise<void> {
	const { error } = await supabase
		.from("vocabulary_entries")
		.delete()
		.eq("id", id);

	if (error) throw error;
}
