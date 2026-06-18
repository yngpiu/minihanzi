import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWord } from "@/lib/supabase/queries";
import { queryKeys } from "./queryKeys";

export function useDeleteWord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteWord,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.words.all() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dueWords() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
		},
	});
}
