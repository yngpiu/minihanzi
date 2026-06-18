export interface WordResult {
	_id?: string;
	id?: number;
	word: string;
	pinyin?: string;
	cn_vi?: string;
	phonetic?: string;
	zhuyin?: string;
	lv_hsk_new?: string;
	lv_tocfl?: string;
	type?: string;
	search_all_means?: string[];
	snym?: { syno?: string[]; anto?: string[] };
	compound?: string;
	content?: WordContent[];
	compare?: CompareItem[];
	measure?: { measure: string; pinyin?: string };
}

export interface WordContent {
	kind?: string;
	means?: WordMean[];
	structs?: WordStruct[];
}

export interface WordMean {
	mean: string;
	explain?: string;
	lv_hsk?: string;
	examples?: Example[];
}

export interface WordStruct {
	struct?: string;
	explain?: string;
	examples?: Example[];
}

export interface Example {
	_id?: string;
	id?: number;
	e: string;
	p?: string;
	p_cn?: string;
	p_vn?: string;
	m?: string;
	type?: string;
}

export interface CompareItem {
	title: string;
	mean_vi?: string;
	words?: string[];
}

export interface SearchResponse {
	found: boolean;
	query: string;
	result: WordResult[];
}

export interface KanjiResult {
	word: string;
	pinyin?: string;
	sets?: string;
	count?: number;
	lucthu?: string;
	strokes?: string;
}

export interface KanjiResponse {
	found: boolean;
	query: string;
	result: KanjiResult[];
}

export interface ChatGPTItem {
	question: string;
	answer: string;
}

export interface ChatGPTData {
	found: boolean;
	query: string;
	result: {
		_id: string;
		pinyin: string;
		word: string;
		chat_gpt: ChatGPTItem[];
		language: string;
	}[];
}

export interface SuggestItem {
	word: string;
	pinyin: string;
	meaning: string;
}
