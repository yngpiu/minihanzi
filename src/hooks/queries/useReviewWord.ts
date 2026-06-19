import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FSRSGrade } from "@/lib/fsrs";
import { reviewWord } from "@/lib/supabase/queries";
import { queryKeys } from "./queryKeys";

export function useReviewWord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ wordId, grade }: { wordId: string; grade: FSRSGrade }) =>
			reviewWord(wordId, grade),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.dueWords() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
			queryClient.invalidateQueries({ queryKey: queryKeys.studyLogs() });
			queryClient.invalidateQueries({ queryKey: queryKeys.words.all() });
		},
	});
}
