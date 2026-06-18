import { useQuery } from "@tanstack/react-query";
import { fetchSuggest } from "@/services/hanzii";
import type { SuggestItem } from "@/services/types";
import { queryKeys } from "./queryKeys";

export function useSuggest(query: string) {
	return useQuery<SuggestItem[]>({
		queryKey: queryKeys.suggest(query),
		queryFn: () => fetchSuggest(query),
		enabled: query.length >= 1,
		staleTime: 60 * 1000,
		gcTime: 5 * 60 * 1000,
		retry: 0,
	});
}
