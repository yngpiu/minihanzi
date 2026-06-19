import { useQuery } from "@tanstack/react-query";
import { enrichWord } from "@/services/ai";

export function useAIEnrich(hanzi: string) {
	return useQuery({
		queryKey: ["ai-enrich", hanzi],
		queryFn: () => enrichWord(hanzi),
		enabled: hanzi.length > 0,
		staleTime: 30 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		retry: 1,
	});
}
