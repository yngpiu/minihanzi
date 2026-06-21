import { useCallback, useEffect, useRef, useState } from "react";
import {
	type CharInfo,
	lookupCharacter,
	lookupWord,
} from "@/lib/dictionary-parser";

interface UseDictionaryLookupResult {
	lookup: (char: string) => Promise<CharInfo | null>;
	lookupAll: (word: string) => Promise<Map<string, CharInfo>>;
	charInfo: CharInfo | null;
	allCharInfo: Map<string, CharInfo>;
	isLoading: boolean;
}

export function useDictionaryLookup(
	hanzi: string,
	autoLookup = true,
): UseDictionaryLookupResult {
	const [charInfo, setCharInfo] = useState<CharInfo | null>(null);
	const [allCharInfo, setAllCharInfo] = useState<Map<string, CharInfo>>(
		new Map(),
	);
	const [isLoading, setIsLoading] = useState(false);
	const prevRef = useRef("");

	const lookup = useCallback(async (char: string) => {
		if (!char) return null;
		return lookupCharacter(char);
	}, []);

	const lookupAll = useCallback(async (word: string) => {
		if (!word) return new Map<string, CharInfo>();
		return lookupWord(word);
	}, []);

	useEffect(() => {
		if (!autoLookup || !hanzi || hanzi === prevRef.current) return;
		prevRef.current = hanzi;

		let cancelled = false;
		setIsLoading(true);

		lookupWord(hanzi)
			.then((result) => {
				if (cancelled) return;
				setAllCharInfo(result);
				if (hanzi.length === 1) {
					setCharInfo(result.get(hanzi) ?? null);
				} else {
					setCharInfo(null);
				}
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [hanzi, autoLookup]);

	return { lookup, lookupAll, charInfo, allCharInfo, isLoading };
}
