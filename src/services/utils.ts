import md5 from "blueimp-md5";

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

let voiceIdx = 0;

export function getAudioUrl(
	id: number | string,
	audioType?: string,
	voice?: number,
): string {
	const t = audioType || "cnvi";
	const v = voice !== undefined ? voice : voiceIdx++ % 2;
	return `https://audio.hanzii.net/audios/${t}/${v}/${id}.mp3`;
}

export function getImageUrl(word: string): string {
	return `https://assets.hanzii.net/img_word/${md5(word)}_h.jpg`;
}

export function getUniqueChars(word: string): string[] {
	const seen: Record<string, boolean> = {};
	const chars: string[] = [];
	for (const c of word) {
		if (CJK_RE.test(c) && !seen[c]) {
			seen[c] = true;
			chars.push(c);
		}
	}
	return chars;
}

const POS_MAP: Record<string, string> = {
	N: "Danh từ",
	V: "Động từ",
	ADJ: "Tính từ",
	ADV: "Trạng từ",
	PREP: "Giới từ",
	CONJ: "Liên từ",
	PRON: "Đại từ",
	NUM: "Số từ",
	M: "Lượng từ",
	CLAS: "Lượng từ",
	PART: "Trợ từ",
	INTERJ: "Thán từ",
	DET: "Định từ",
	AUX: "Trợ động từ",
	PREF: "Tiền tố",
	SUFF: "Hậu tố",
	IDIOM: "Thành ngữ",
};

export function translateKind(kind: string): string {
	return POS_MAP[kind.toUpperCase()] || kind;
}

export function getKaraokeTokens(
	text: string,
): { w: string; isChar: boolean }[] {
	const tokens: { w: string; isChar: boolean }[] = [];
	let buf = "";
	for (const c of text) {
		if (CJK_RE.test(c)) {
			if (buf) {
				tokens.push({ w: buf, isChar: false });
				buf = "";
			}
			tokens.push({ w: c, isChar: true });
		} else if (c === " ") {
			if (buf) {
				tokens.push({ w: buf, isChar: false });
				buf = "";
			}
		} else {
			buf += c;
		}
	}
	if (buf) tokens.push({ w: buf, isChar: false });
	return tokens;
}
