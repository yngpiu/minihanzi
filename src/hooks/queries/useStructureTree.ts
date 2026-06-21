import { useQueries } from "@tanstack/react-query";
import { searchKanji } from "@/services/hanzii";
import type { StructureNode } from "@/services/types";
import { queryKeys } from "./queryKeys";

const MAX_DEPTH = 3;

async function fetchNode(char: string, depth: number): Promise<StructureNode> {
	if (depth > MAX_DEPTH) return { char };

	try {
		const resp = await searchKanji(char);
		if (!resp.found || !resp.result?.[0]) return { char };

		const r = resp.result[0];
		const node: StructureNode = {
			char,
			hinhthai: r.hinhthai,
			sets: r.sets,
		};

		if (r.hinhthai && r.detail?.comp && r.detail.comp.length > 0) {
			node.comps = await Promise.all(
				r.detail.comp.map((c) => fetchNode(c, depth + 1)),
			);
		}

		return node;
	} catch {
		return { char };
	}
}

export function useStructureTree(chars: string[]) {
	const unique = [...new Set(chars.filter((c) => c.length === 1))];

	return useQueries({
		queries: unique.map((ch) => ({
			queryKey: queryKeys.structureTree(ch),
			queryFn: () => fetchNode(ch, 0),
			staleTime: 30 * 60 * 1000,
			gcTime: 60 * 60 * 1000,
			retry: 0,
		})),
		combine: (results) => {
			const map = new Map<string, StructureNode>();
			for (let i = 0; i < unique.length; i++) {
				if (results[i]?.data) {
					map.set(unique[i], results[i].data);
				}
			}
			return {
				getNode: (ch: string) => map.get(ch),
				isLoading: results.some((r) => r.isLoading),
			};
		},
	});
}
