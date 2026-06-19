import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWord } from "@/lib/supabase/queries";
import { queryKeys } from "./queryKeys";

export function useUpdateWord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			fields,
		}: {
			id: string;
			fields: Parameters<typeof updateWord>[1];
		}) => updateWord(id, fields),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.words.all() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dueWords() });
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
		},
	});
}
