import type { SuggestItem } from "./types";

const CACHE_KEY = "suggest-cache";
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
	data: SuggestItem[];
	ts: number;
}

export function getCachedSuggest(query: string): SuggestItem[] | null {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const cache = JSON.parse(raw) as Record<string, CacheEntry>;
		const entry = cache[query];
		if (!entry) return null;
		if (Date.now() - entry.ts > CACHE_TTL) {
			delete cache[query];
			localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
			return null;
		}
		return entry.data;
	} catch {
		return null;
	}
}

export function setCachedSuggest(query: string, data: SuggestItem[]): void {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		const cache = raw ? JSON.parse(raw) : {};
		cache[query] = { data, ts: Date.now() };
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch {
		/* ignore */
	}
}
