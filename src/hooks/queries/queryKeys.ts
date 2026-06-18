export const queryKeys = {
	wordSearch: (query: string) => ["word-search", query] as const,
	kanjiSearch: (chars: string[]) => ["kanji-search", chars] as const,
	suggest: (query: string) => ["suggest", query] as const,
	chatGpt: (word: string, pinyin?: string) =>
		["chatgpt", word, pinyin] as const,
	words: {
		all: () => ["words"] as const,
		detail: (id: string) => ["words", id] as const,
	},
	dueWords: () => ["due-words"] as const,
	dashboard: () => ["dashboard"] as const,
	studyLogs: (days?: number) => ["study-logs", days] as const,
};
