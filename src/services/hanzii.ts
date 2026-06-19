import { buildApiUrl, fetchWithRetry } from "./api-client";
import { decryptData } from "./crypto";
import { getCachedSuggest, setCachedSuggest } from "./suggest-cache";
import type {
	ChatGPTData,
	KanjiResponse,
	SearchResponse,
	SuggestItem,
} from "./types";

const BASE_WORD = "https://api2.hanzii.net";
const BASE_SUGGEST = "https://suggest.hanzii.net";
const BASE_CHATGPT = "https://api.hanzii.net";

export async function searchWord(
	query: string,
	page = 1,
	limit = 50,
): Promise<SearchResponse> {
	const url = buildApiUrl(
		BASE_WORD,
		`/proxy/hanzii-word/api/search/all/vi/word/?key=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
	);
	const resp = await fetchWithRetry(url);
	const json = await resp.json();
	return decryptData<SearchResponse>(json.data);
}

export async function searchKanji(query: string): Promise<KanjiResponse> {
	const url = buildApiUrl(
		BASE_WORD,
		`/proxy/hanzii-kanji/api/search/all/vi/kanji/?key=${encodeURIComponent(query)}&page=1&limit=5`,
	);
	const resp = await fetchWithRetry(url);
	const json = await resp.json();
	return decryptData<KanjiResponse>(json.data);
}

export async function fetchSuggest(query: string): Promise<SuggestItem[]> {
	const cached = getCachedSuggest(query);
	if (cached) return cached;

	const url = buildApiUrl(BASE_SUGGEST, "/proxy/hanzii-suggest/api/suggest");
	const resp = await fetchWithRetry(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ keyword: query, dict: "cnvi" }),
	});
	const json = await resp.json();
	const items: SuggestItem[] =
		json.status !== 200 || !Array.isArray(json.data)
			? []
			: [
					...new Map(
						json.data.map((item: string) => {
							const parts = item.split("#");
							return [
								parts[0],
								{
									word: parts[0] || "",
									pinyin: parts[2] || "",
									meaning: parts[3] || "",
								},
							] as const;
						}),
					).values(),
				];

	setCachedSuggest(query, items);
	return items;
}

export async function fetchChatGPT(
	word: string,
	pinyin?: string,
): Promise<ChatGPTData | null> {
	const url = buildApiUrl(
		BASE_CHATGPT,
		`/proxy/hanzii-chatgpt/api/v2/search/vi/chatgpt/${encodeURIComponent(word)}?pinyin=${encodeURIComponent(pinyin || "")}`,
	);
	const resp = await fetchWithRetry(url);
	if (!resp.ok) return null;
	const json = await resp.json();
	return decryptData<ChatGPTData>(json.data);
}
