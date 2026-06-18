import { createContext, useContext } from "react";

export interface SearchContextType {
	searchValue: string;
	setSearchValue: (v: string) => void;
}

export const SearchContext = createContext<SearchContextType | null>(null);

export function useSearchContext() {
	const ctx = useContext(SearchContext);
	if (!ctx) {
		throw new Error("useSearchContext must be used within a SearchProvider");
	}
	return ctx;
}
