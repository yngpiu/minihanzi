export interface CharInfo {
	character: string;
	pinyin: string[];
	definition?: string;
	radical?: string;
	decomposition?: string;
}

let cache: Map<string, CharInfo> | null = null;
let loading: Promise<Map<string, CharInfo>> | null = null;

async function fetchDictionary(): Promise<Map<string, CharInfo>> {
	const resp = await fetch("/data/dictionary.txt");
	const text = await resp.text();
	const map = new Map<string, CharInfo>();
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			const obj = JSON.parse(trimmed);
			if (obj.character) {
				map.set(obj.character, {
					character: obj.character,
					pinyin: obj.pinyin ?? [],
					definition: obj.definition,
					radical: obj.radical,
					decomposition: obj.decomposition,
				});
			}
		} catch {
			/* skip malformed lines */
		}
	}
	return map;
}

export async function lookupCharacter(char: string): Promise<CharInfo | null> {
	if (!cache) {
		if (!loading) loading = fetchDictionary();
		cache = await loading;
	}
	return cache.get(char) ?? null;
}

export async function lookupWord(word: string): Promise<Map<string, CharInfo>> {
	if (!cache) {
		if (!loading) loading = fetchDictionary();
		cache = await loading;
	}
	const result = new Map<string, CharInfo>();
	for (const char of word) {
		const info = cache.get(char);
		if (info) result.set(char, info);
	}
	return result;
}
