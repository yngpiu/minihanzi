import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
	const raw = fs.readFileSync(path.join(root, ".env"), "utf-8");
	const url = raw.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
	const key = raw.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1]?.trim();
	if (!url || !key) throw new Error("Missing Supabase env vars");
	return { url, key };
}

const { url, key } = loadEnv();
const supabase = createClient(url, key, {
	auth: { persistSession: false },
});

const entries = [
	{
		hanzi: "好",
		pinyin: "hǎo",
		meanings: [
			{ meaning: "tốt, lành", example: { hanzi: "好人", pinyin: "hǎo rén", meaning: "người tốt" } },
			{ meaning: "dễ", example: { hanzi: "好吃", pinyin: "hǎo chī", meaning: "ngon (dễ ăn)" } },
			{ meaning: "rất", example: { hanzi: "好久不见", pinyin: "hǎo jiǔ bù jiàn", meaning: "lâu không gặp" } },
		],
		compounds: [
			{
				hanzi: "好吃", pinyin: "hǎo chī", meaning: "ngon",
				examples: [{ hanzi: "这个菜很好吃", pinyin: "zhè ge cài hěn hǎo chī", meaning: "món này rất ngon" }],
			},
			{
				hanzi: "好像", pinyin: "hǎo xiàng", meaning: "giống như, có vẻ",
				examples: [
					{ hanzi: "他好像不高兴", pinyin: "tā hǎo xiàng bù gāo xìng", meaning: "anh ấy có vẻ không vui" },
				],
			},
			{
				hanzi: "好吃懒做", pinyin: "hǎo chī lǎn zuò", meaning: "ham ăn lười làm",
				examples: [{ hanzi: "他这个人好吃懒做", pinyin: "tā zhè ge rén hǎo chī lǎn zuò", meaning: "nó là đứa ham ăn lười làm" }],
			},
		],
	},
	{
		hanzi: "学",
		pinyin: "xué",
		meanings: [
			{ meaning: "học", example: { hanzi: "学习", pinyin: "xué xí", meaning: "học tập" } },
			{ meaning: "môn học", example: { hanzi: "数学", pinyin: "shù xué", meaning: "toán học" } },
		],
		compounds: [
			{
				hanzi: "学习", pinyin: "xué xí", meaning: "học tập",
				examples: [{ hanzi: "我在学习中文", pinyin: "wǒ zài xué xí zhōng wén", meaning: "tôi đang học tiếng Trung" }],
			},
			{
				hanzi: "学生", pinyin: "xué shēng", meaning: "học sinh",
				examples: [{ hanzi: "他是好学生", pinyin: "tā shì hǎo xué shēng", meaning: "anh ấy là học sinh giỏi" }],
			},
			{
				hanzi: "学校", pinyin: "xué xiào", meaning: "trường học",
				examples: [{ hanzi: "学校很大", pinyin: "xué xiào hěn dà", meaning: "trường học rất lớn" }],
			},
		],
	},
	{
		hanzi: "大",
		pinyin: "dà",
		meanings: [
			{ meaning: "to, lớn", example: { hanzi: "大城市", pinyin: "dà chéng shì", meaning: "thành phố lớn" } },
			{ meaning: "già (người)", example: { hanzi: "他比我大", pinyin: "tā bǐ wǒ dà", meaning: "anh ấy lớn hơn tôi" } },
		],
		compounds: [
			{
				hanzi: "大学", pinyin: "dà xué", meaning: "đại học",
				examples: [{ hanzi: "他在上大学", pinyin: "tā zài shàng dà xué", meaning: "anh ấy đang học đại học" }],
			},
			{
				hanzi: "大家", pinyin: "dà jiā", meaning: "mọi người",
				examples: [{ hanzi: "大家好", pinyin: "dà jiā hǎo", meaning: "chào mọi người" }],
			},
		],
	},
	{
		hanzi: "人",
		pinyin: "rén",
		meanings: [
			{ meaning: "người", example: { hanzi: "中国人", pinyin: "zhōng guó rén", meaning: "người Trung Quốc" } },
		],
		compounds: [
			{
				hanzi: "人民", pinyin: "rén mín", meaning: "nhân dân",
				examples: [{ hanzi: "为人民服务", pinyin: "wèi rén mín fú wù", meaning: "phục vụ nhân dân" }],
			},
			{
				hanzi: "朋友", pinyin: "péng yǒu", meaning: "bạn bè",
				examples: [{ hanzi: "他是我的朋友", pinyin: "tā shì wǒ de péng yǒu", meaning: "anh ấy là bạn tôi" }],
			},
		],
	},
	{
		hanzi: "水",
		pinyin: "shuǐ",
		meanings: [
			{ meaning: "nước", example: { hanzi: "喝水", pinyin: "hē shuǐ", meaning: "uống nước" } },
		],
		compounds: [
			{
				hanzi: "水果", pinyin: "shuǐ guǒ", meaning: "hoa quả",
				examples: [{ hanzi: "我喜欢吃水果", pinyin: "wǒ xǐ huān chī shuǐ guǒ", meaning: "tôi thích ăn hoa quả" }],
			},
			{
				hanzi: "水平", pinyin: "shuǐ píng", meaning: "trình độ",
				examples: [{ hanzi: "他的中文水平很高", pinyin: "tā de zhōng wén shuǐ píng hěn gāo", meaning: "trình độ tiếng Trung của anh ấy rất cao" }],
			},
		],
	},
	{
		hanzi: "爱",
		pinyin: "ài",
		meanings: [
			{ meaning: "yêu", example: { hanzi: "我爱你", pinyin: "wǒ ài nǐ", meaning: "anh yêu em" } },
			{ meaning: "thích", example: { hanzi: "我爱看电影", pinyin: "wǒ ài kàn diàn yǐng", meaning: "tôi thích xem phim" } },
		],
		compounds: [
			{
				hanzi: "爱情", pinyin: "ài qíng", meaning: "tình yêu",
				examples: [{ hanzi: "他们的爱情很美", pinyin: "tā men de ài qíng hěn měi", meaning: "tình yêu của họ rất đẹp" }],
			},
			{
				hanzi: "可爱", pinyin: "kě ài", meaning: "đáng yêu",
				examples: [{ hanzi: "这只小猫很可爱", pinyin: "zhè zhī xiǎo māo hěn kě ài", meaning: "con mèo nhỏ này rất đáng yêu" }],
			},
		],
	},
	{
		hanzi: "吃",
		pinyin: "chī",
		meanings: [
			{ meaning: "ăn", example: { hanzi: "吃饭", pinyin: "chī fàn", meaning: "ăn cơm" } },
		],
		compounds: [
			{
				hanzi: "吃饭", pinyin: "chī fàn", meaning: "ăn cơm",
				examples: [{ hanzi: "你吃饭了吗？", pinyin: "nǐ chī fàn le ma?", meaning: "bạn ăn cơm chưa?" }],
			},
			{
				hanzi: "吃亏", pinyin: "chī kuī", meaning: "thiệt thòi",
				examples: [{ hanzi: "他吃亏了", pinyin: "tā chī kuī le", meaning: "anh ấy bị thiệt rồi" }],
			},
		],
	},
	{
		hanzi: "看",
		pinyin: "kàn",
		meanings: [
			{ meaning: "xem, nhìn", example: { hanzi: "看电视", pinyin: "kàn diàn shì", meaning: "xem tivi" } },
			{ meaning: "đọc", example: { hanzi: "看书", pinyin: "kàn shū", meaning: "đọc sách" } },
			{ meaning: "thăm", example: { hanzi: "看病", pinyin: "kàn bìng", meaning: "khám bệnh" } },
		],
		compounds: [],
	},
	{
		hanzi: "我",
		pinyin: "wǒ",
		meanings: [
			{ meaning: "tôi, tớ, mình", example: { hanzi: "我是学生", pinyin: "wǒ shì xué shēng", meaning: "tôi là học sinh" } },
		],
		compounds: [],
	},
	{
		hanzi: "中",
		pinyin: "zhōng",
		meanings: [
			{ meaning: "giữa, trung", example: { hanzi: "中午", pinyin: "zhōng wǔ", meaning: "trưa (giữa ngày)" } },
			{ meaning: "Trung Quốc", example: { hanzi: "中文", pinyin: "zhōng wén", meaning: "tiếng Trung" } },
		],
		compounds: [
			{
				hanzi: "中文", pinyin: "zhōng wén", meaning: "tiếng Trung",
				examples: [{ hanzi: "我在学中文", pinyin: "wǒ zài xué zhōng wén", meaning: "tôi đang học tiếng Trung" }],
			},
			{
				hanzi: "中午", pinyin: "zhōng wǔ", meaning: "buổi trưa",
				examples: [{ hanzi: "中午我们一起吃饭", pinyin: "zhōng wǔ wǒ men yì qǐ chī fàn", meaning: "trưa nay chúng ta cùng ăn cơm" }],
			},
		],
	},
	{
		hanzi: "天",
		pinyin: "tiān",
		meanings: [
			{ meaning: "trời, bầu trời", example: { hanzi: "今天天气很好", pinyin: "jīn tiān tiān qì hěn hǎo", meaning: "hôm nay thời tiết đẹp" } },
			{ meaning: "ngày", example: { hanzi: "三天", pinyin: "sān tiān", meaning: "ba ngày" } },
		],
		compounds: [
			{
				hanzi: "今天", pinyin: "jīn tiān", meaning: "hôm nay",
				examples: [{ hanzi: "今天我很忙", pinyin: "jīn tiān wǒ hěn máng", meaning: "hôm nay tôi rất bận" }],
			},
			{
				hanzi: "明天", pinyin: "míng tiān", meaning: "ngày mai",
				examples: [{ hanzi: "明天见!", pinyin: "míng tiān jiàn!", meaning: "hẹn mai gặp!" }],
			},
			{
				hanzi: "天气", pinyin: "tiān qì", meaning: "thời tiết",
				examples: [{ hanzi: "今天天气真好", pinyin: "jīn tiān tiān qì zhēn hǎo", meaning: "hôm nay thời tiết thật đẹp" }],
			},
		],
	},
	{
		hanzi: "小",
		pinyin: "xiǎo",
		meanings: [
			{ meaning: "nhỏ, bé", example: { hanzi: "小猫", pinyin: "xiǎo māo", meaning: "mèo con" } },
		],
		compounds: [
			{
				hanzi: "小姐", pinyin: "xiǎo jiě", meaning: "tiểu thư, cô gái",
				examples: [{ hanzi: "这位小姐姓什么？", pinyin: "zhè wèi xiǎo jiě xìng shén me?", meaning: "cô gái này họ gì?" }],
			},
			{
				hanzi: "小心", pinyin: "xiǎo xīn", meaning: "cẩn thận",
				examples: [{ hanzi: "小心开车", pinyin: "xiǎo xīn kāi chē", meaning: "lái xe cẩn thận" }],
			},
		],
	},
];

async function main() {
	console.log("=== Seeding vocabulary_entries ===\n");

	for (const entry of entries) {
		const { data, error } = await supabase
			.from("vocabulary_entries")
			.insert({
				hanzi: entry.hanzi,
				pinyin: entry.pinyin,
				meanings: entry.meanings,
				compounds: entry.compounds,
			})
			.select()
			.single();

		if (error) {
			console.error(`  ✗ ${entry.hanzi}: ${error.message}`);
		} else {
			console.log(`  ✓ ${entry.hanzi} (${entry.pinyin}) — ${entry.meanings.map((m) => m.meaning).join(", ")}`);
		}
	}

	console.log(`\nDone. ${entries.length} entries processed.`);
}

main();
