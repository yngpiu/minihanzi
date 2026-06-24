import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createEntry,
	deleteEntry,
	fetchAllEntries,
	updateEntry,
	type VocabEntry,
} from "@/lib/supabase/vocabulary-custom";

export const vocabularyCustomKeys = {
	all: ["vocabulary-custom"] as const,
};

export function useVocabularyEntries() {
	return useQuery({
		queryKey: vocabularyCustomKeys.all,
		queryFn: fetchAllEntries,
		staleTime: 30_000,
	});
}

export function useCreateEntry() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (
			entry: Pick<VocabEntry, "hanzi" | "pinyin" | "kind_groups" | "compounds">,
		) => createEntry(entry),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: vocabularyCustomKeys.all });
		},
	});
}

export function useUpdateEntry() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...updates
		}: { id: number } & Partial<
			Pick<VocabEntry, "hanzi" | "pinyin" | "kind_groups" | "compounds">
		>) => updateEntry(id, updates),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: vocabularyCustomKeys.all });
		},
	});
}

export function useDeleteEntry() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteEntry(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: vocabularyCustomKeys.all });
		},
	});
}
