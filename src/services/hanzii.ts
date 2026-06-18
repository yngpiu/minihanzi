import { decryptData } from "./crypto";
import type {
	ChatGPTData,
	KanjiResponse,
	SearchResponse,
	SuggestItem,
} from "./types";

export async function searchWord(
	query: string,
	page = 1,
	limit = 50,
): Promise<SearchResponse> {
	const url = `https://api2.hanzii.net/api/search/all/vi/word/?key=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
	const resp = await fetch(url);
	if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
	const json = await resp.json();
	return decryptData<SearchResponse>(json.data);
}

export async function searchKanji(query: string): Promise<KanjiResponse> {
	const url = `https://api2.hanzii.net/api/search/all/vi/kanji/?key=${encodeURIComponent(query)}&page=1&limit=5`;
	const resp = await fetch(url);
	if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
	const json = await resp.json();
	return decryptData<KanjiResponse>(json.data);
}

export async function fetchSuggest(query: string): Promise<SuggestItem[]> {
	const resp = await fetch("https://suggest.hanzii.net/api/suggest", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ keyword: query, dict: "cnvi" }),
	});
	if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
	const json = await resp.json();
	if (json.status !== 200 || !Array.isArray(json.data)) return [];
	return json.data.map((item: string) => {
		const parts = item.split("#");
		return {
			word: parts[0] || "",
			pinyin: parts[2] || "",
			meaning: parts[3] || "",
		};
	});
}

export async function fetchChatGPT(
	word: string,
	pinyin?: string,
): Promise<ChatGPTData | null> {
	const url = `https://api.hanzii.net/api/v2/search/vi/chatgpt/${encodeURIComponent(word)}?pinyin=${encodeURIComponent(pinyin || "")}`;
	const resp = await fetch(url);
	if (!resp.ok) return null;
	const json = await resp.json();
	return decryptData<ChatGPTData>(json.data);
}
