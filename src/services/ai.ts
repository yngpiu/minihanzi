import { GoogleGenAI } from "@google/genai";
import type { ExampleData, RadicalNode } from "@/lib/types";

const ai = new GoogleGenAI({
	apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export type AIEnrichResult = {
	pinyin: string;
	meaning: string;
	radical_components: RadicalNode[];
	etymology: string;
	example_data: ExampleData;
};

const PROMPT = `Bạn là trợ lý từ điển Trung-Việt. Hãy phân tích chữ Hán sau đây.

Trả về JSON thuần, không markdown, không escape.

Các trường:
- pinyin: "phiên âm pinyin có dấu thanh điệu"
- meaning: "nghĩa tiếng Việt ngắn gọn"
- etymology: "chiết tự — giải thích cấu tạo chữ và câu chuyện gợi nhớ (tiếng Việt)"
- example_data: object { hanzi: "câu ví dụ bằng chữ Hán", pinyin: "pinyin của câu ví dụ", meaning: "nghĩa tiếng Việt của câu ví dụ" }

- radical_components: MẢNG CÁC NODE CÂY — mỗi node là object:
  { char: "chữ Hán", pinyin: "pinyin", meaning: "nghĩa tiếng Việt", role: "vai trò", children: [...] }

  CẤU TRÚC CÂY (đệ quy):
  Cấp 1: mỗi phần tử trong mảng là một chữ Hán trong từ (VD: "你好" → ["你", "好"])
  Cấp 2: mỗi chữ lại tách ra các bộ thủ / bộ phận cấu tạo nên chữ đó
  Cấp 3 (nếu có): bộ thủ phức tạp lại tách tiếp

  Mỗi node có thể có children (mảng) để phân tích sâu hơn.
  Nếu node là lá (không thể tách tiếp), bỏ qua field children.

  role là vai trò của node đó: "chữ thứ nhất", "chữ thứ hai", "bộ thủ (biểu ý)", "bộ phận (biểu âm)", "bộ thủ (tượng hình)" v.v.

QUAN TRỌNG:
- radical_components PHẢI là mảng các node (cấp 1 là từng chữ trong từ)
- Cây phải đệ quy đúng: chữ → bộ thủ → bộ phận nhỏ hơn (nếu có)
- example_data phải là object, không phải string`;

export async function enrichWord(hanzi: string): Promise<AIEnrichResult> {
	const response = await ai.models.generateContent({
		model: "gemini-3.5-flash",
		contents: `${PROMPT}\n\nChữ Hán: ${hanzi}`,
	});

	const text = response.text;
	if (!text) throw new Error("Gemini returned empty response");

	return JSON.parse(text) as AIEnrichResult;
}
