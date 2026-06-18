import { useQuery } from "@tanstack/react-query";
import { getDueWords } from "@/lib/supabase/queries";
import type { WordWithReview } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useDueWords() {
	return useQuery<WordWithReview[]>({
		queryKey: queryKeys.dueWords(),
		queryFn: getDueWords,
		refetchInterval: 10 * 60 * 1000,
	});
}
