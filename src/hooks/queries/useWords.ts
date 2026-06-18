import { useQuery } from "@tanstack/react-query";
import { getWords } from "@/lib/supabase/queries";
import type { WordWithReview } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useWords() {
	return useQuery<WordWithReview[]>({
		queryKey: queryKeys.words.all(),
		queryFn: getWords,
	});
}
