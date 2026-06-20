import { useQuery } from "@tanstack/react-query";
import {
	fetchPaths,
	fetchPathsWithSets,
	fetchPhonetic,
	fetchStudySet,
	searchVocabulary,
} from "@/lib/supabase/vocabulary";

export const vocabularyKeys = {
	all: ["vocabulary"] as const,
	paths: () => [...vocabularyKeys.all, "paths"] as const,
	pathsWithSets: () => [...vocabularyKeys.all, "paths", "with-sets"] as const,
	studySet: (id: number) => [...vocabularyKeys.all, "study-set", id] as const,
	search: (q: string) => [...vocabularyKeys.all, "search", q] as const,
	phonetic: () => [...vocabularyKeys.all, "phonetic"] as const,
};

export function usePaths() {
	return useQuery({
		queryKey: vocabularyKeys.paths(),
		queryFn: fetchPaths,
		staleTime: Infinity,
	});
}

export function usePathsWithSets() {
	return useQuery({
		queryKey: vocabularyKeys.pathsWithSets(),
		queryFn: fetchPathsWithSets,
		staleTime: Infinity,
	});
}

export function useStudySet(id: number) {
	return useQuery({
		queryKey: vocabularyKeys.studySet(id),
		queryFn: () => fetchStudySet(id),
		staleTime: Infinity,
	});
}

export function useSearchVocabulary(query: string) {
	return useQuery({
		queryKey: vocabularyKeys.search(query),
		queryFn: () => searchVocabulary(query),
		enabled: query.trim().length > 0,
		staleTime: 30_000,
	});
}

export function usePhonetic() {
	return useQuery({
		queryKey: vocabularyKeys.phonetic(),
		queryFn: fetchPhonetic,
		staleTime: Infinity,
	});
}
