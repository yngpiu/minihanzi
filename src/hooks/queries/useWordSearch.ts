import { useQuery } from "@tanstack/react-query";
import { searchWord } from "@/services/hanzii";
import type { SearchResponse } from "@/services/types";
import { queryKeys } from "./queryKeys";

export function useWordSearch(query: string) {
	return useQuery<SearchResponse>({
		queryKey: queryKeys.wordSearch(query),
		queryFn: () => searchWord(query),
		enabled: query.length > 0,
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		retry: 1,
	});
}
