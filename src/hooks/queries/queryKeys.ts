export const queryKeys = {
	wordSearch: (query: string) => ["word-search", query] as const,
	kanjiSearch: (chars: string[]) => ["kanji-search", chars] as const,
	suggest: (query: string) => ["suggest", query] as const,
	chatGpt: (word: string, pinyin?: string) =>
		["chatgpt", word, pinyin] as const,
	structureTree: (char: string) => ["structure-tree", char] as const,
};
