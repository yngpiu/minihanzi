import { supabase } from "./client";

export interface VocabExample {
	hanzi: string;
	pinyin: string;
	meaning: string;
}

export interface MeanItem {
	meaning: string;
	examples: VocabExample[];
}

export interface KindGroup {
	kind: string;
	means: MeanItem[];
}

export interface VocabCompound {
	hanzi: string;
	pinyin: string;
	kind_groups: KindGroup[];
}

export interface VocabEntry {
	id: number;
	hanzi: string;
	pinyin: string;
	kind_groups: KindGroup[];
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
	return (data ?? []).map(normalizeEntry);
}

function normalizeEntry(entry: Record<string, unknown>): VocabEntry {
	return {
		id: entry.id as number,
		hanzi: (entry.hanzi as string) ?? "",
		pinyin: (entry.pinyin as string) ?? "",
		kind_groups: (entry.kind_groups as KindGroup[]) ?? [],
		compounds: (entry.compounds as VocabCompound[]) ?? [],
		created_at: (entry.created_at as string) ?? "",
		updated_at: (entry.updated_at as string) ?? "",
	};
}

export async function createEntry(
	entry: Pick<VocabEntry, "hanzi" | "pinyin" | "kind_groups" | "compounds">,
): Promise<VocabEntry> {
	const { data, error } = await supabase
		.from("vocabulary_entries")
		.insert({
			hanzi: entry.hanzi,
			pinyin: entry.pinyin,
			kind_groups: entry.kind_groups ?? [],
			compounds: entry.compounds ?? [],
		})
		.select()
		.single();

	if (error) throw error;
	return normalizeEntry(data as Record<string, unknown>);
}

export async function updateEntry(
	id: number,
	updates: Partial<
		Pick<VocabEntry, "hanzi" | "pinyin" | "kind_groups" | "compounds">
	>,
): Promise<VocabEntry> {
	const { data, error } = await supabase
		.from("vocabulary_entries")
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return normalizeEntry(data as Record<string, unknown>);
}

export async function deleteEntry(id: number): Promise<void> {
	const { error } = await supabase
		.from("vocabulary_entries")
		.delete()
		.eq("id", id);

	if (error) throw error;
}
