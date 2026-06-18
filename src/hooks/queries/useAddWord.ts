import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWord } from "@/lib/supabase/queries";
import { queryKeys } from "./queryKeys";

export function useAddWord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: addWord,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.words.all() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dueWords() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
			queryClient.invalidateQueries({ queryKey: queryKeys.studyLogs() });
		},
	});
}
