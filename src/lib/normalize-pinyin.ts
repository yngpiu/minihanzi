type ToneInfo = {
	base: string;
	tone: "" | "1" | "2" | "3" | "4";
};

const TONE_MAP: Record<string, ToneInfo> = {
	ā: { base: "a", tone: "1" },
	á: { base: "a", tone: "2" },
	ǎ: { base: "a", tone: "3" },
	à: { base: "a", tone: "4" },
	ē: { base: "e", tone: "1" },
	é: { base: "e", tone: "2" },
	ě: { base: "e", tone: "3" },
	è: { base: "e", tone: "4" },
	ī: { base: "i", tone: "1" },
	í: { base: "i", tone: "2" },
	ǐ: { base: "i", tone: "3" },
	ì: { base: "i", tone: "4" },
	ō: { base: "o", tone: "1" },
	ó: { base: "o", tone: "2" },
	ǒ: { base: "o", tone: "3" },
	ò: { base: "o", tone: "4" },
	ū: { base: "u", tone: "1" },
	ú: { base: "u", tone: "2" },
	ǔ: { base: "u", tone: "3" },
	ù: { base: "u", tone: "4" },
	ǖ: { base: "v", tone: "1" },
	ü: { base: "v", tone: "" },
	ǘ: { base: "v", tone: "2" },
	ǚ: { base: "v", tone: "3" },
	ǜ: { base: "v", tone: "4" },
};

const TONE_NUM_REGEX = /^([a-züv]+)([1-4])$/;

/**
 * Insert spaces at syllable boundaries when tone numbers (1-4) are used
 * as delimiters in joined input like "ni3hao3" → "ni3 hao3".
 */
function insertBreakPoints(input: string): string {
	return input.replace(/([1-4])(?=[a-züv])/gi, "$1 ");
}

function splitSyllables(input: string): string[] {
	const s = input
		.toLowerCase()
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[.;，。、！？]/g, "")
		.replace(/'/g, " ");

	const expanded = insertBreakPoints(s);
	return expanded.split(/\s+/).filter(Boolean);
}

function processSyllable(syl: string): {
	base: string;
	tone: "" | "1" | "2" | "3" | "4";
} {
	let tone: "" | "1" | "2" | "3" | "4" = "";
	let base = "";

	for (const ch of syl) {
		const info = TONE_MAP[ch as keyof typeof TONE_MAP];
		if (info) {
			base += info.base;
			if (info.tone) tone = info.tone;
		} else {
			base += ch;
		}
	}

	const explicitTone = base.match(TONE_NUM_REGEX);
	if (explicitTone) {
		return { base: explicitTone[1], tone: explicitTone[2] as typeof tone };
	}

	return { base, tone };
}

export function normalizePinyin(input: string): string {
	const syllables = splitSyllables(input);
	if (syllables.length === 0) return input.toLowerCase().trim();

	return syllables
		.map((syl) => processSyllable(syl).base.replace("v", "ü"))
		.join("");
}

export function normalizePinyinWithTones(input: string): string {
	const syllables = splitSyllables(input);
	if (syllables.length === 0) return input.toLowerCase().trim();

	const normalized = syllables
		.map((syl) => {
			const info = processSyllable(syl);
			const base = info.base.replace("v", "ü");
			return info.tone ? `${base}${info.tone}` : base;
		})
		.join(" ");

	return normalized;
}

export function pinyinMatch(userInput: string, correctPinyin: string): boolean {
	const userNorm = normalizePinyin(userInput);
	const correctNorm = normalizePinyin(correctPinyin);
	return userNorm === correctNorm;
}
