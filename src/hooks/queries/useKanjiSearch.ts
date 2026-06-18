import { useQuery } from "@tanstack/react-query";
import { searchKanji } from "@/services/hanzii";
import type { KanjiResponse } from "@/services/types";
import { queryKeys } from "./queryKeys";

export function useKanjiSearch(characters: string[]) {
	const chars = [
		...new Set(
			characters.filter((c) =>
				/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(c),
			),
		),
	];
	return useQuery<KanjiResponse[]>({
		queryKey: queryKeys.kanjiSearch(chars),
		queryFn: async () => {
			const results = await Promise.allSettled(
				chars.map((ch) => searchKanji(ch)),
			);
			return results
				.filter(
					(r): r is PromiseFulfilledResult<KanjiResponse> =>
						r.status === "fulfilled",
				)
				.map((r) => r.value);
		},
		enabled: chars.length > 0,
		staleTime: 10 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		retry: 0,
	});
}
