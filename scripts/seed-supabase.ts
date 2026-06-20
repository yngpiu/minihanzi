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

const BATCH = 500;

async function seedPaths() {
	console.log("Seeding paths...");
	const data: { id: number; title: string; tags: string }[] = JSON.parse(
		fs.readFileSync(path.join(root, "openquiz-chinese-vocabulary.json"), "utf-8"),
	).map((p: { id: number; title: string; tags: string }) => ({
		id: p.id,
		title: p.title,
		tags: p.tags,
	}));

	const { error } = await supabase.from("paths").upsert(data, {
		onConflict: "id",
		ignoreDuplicates: false,
	});
	if (error) throw new Error(`Failed to seed paths: ${error.message}`);
	console.log(`  -> ${data.length} paths`);
}

async function seedStudySets() {
	console.log("Seeding study sets...");
	const raw: { id: number; studySets: { id: number; title: string; wordCount: number }[] }[] =
		JSON.parse(
			fs.readFileSync(
				path.join(root, "openquiz-chinese-vocabulary.json"),
				"utf-8",
			),
		);

	const data: { id: number; path_id: number; title: string; word_count: number }[] = [];
	for (const p of raw) {
		for (const s of p.studySets) {
			data.push({
				id: s.id,
				path_id: p.id,
				title: s.title,
				word_count: s.wordCount,
			});
		}
	}

	for (let i = 0; i < data.length; i += BATCH) {
		const batch = data.slice(i, i + BATCH);
		const { error } = await supabase.from("study_sets").upsert(batch, {
			onConflict: "id",
			ignoreDuplicates: false,
		});
		if (error) throw new Error(`Failed to seed study_sets: ${error.message}`);
	}
	console.log(`  -> ${data.length} study sets`);
}

async function seedVocabulary() {
	console.log("Seeding vocabulary...");
	const raw: { studySets: { id: number; words: { hanzi: string; pinyin: string; vietnamese: string; type: string; example: string; synonyms: string[] }[] }[] }[] =
		JSON.parse(
			fs.readFileSync(
				path.join(root, "openquiz-chinese-vocabulary.json"),
				"utf-8",
			),
		);

	const data: {
		set_id: number;
		hanzi: string;
		pinyin: string;
		vietnamese: string;
		type: string;
		example: string;
		synonyms: string[];
	}[] = [];

	const seen = new Set<string>();

	for (const p of raw) {
		for (const s of p.studySets) {
			for (const w of s.words) {
				const key = `${s.id}-${w.hanzi}`;
				if (seen.has(key)) continue;
				seen.add(key);
				data.push({
					set_id: s.id,
					hanzi: w.hanzi,
					pinyin: w.pinyin,
					vietnamese: w.vietnamese,
					type: w.type,
					example: w.example ?? "",
					synonyms: w.synonyms ?? [],
				});
			}
		}
	}

	for (let i = 0; i < data.length; i += BATCH) {
		const batch = data.slice(i, i + BATCH);
		const { error } = await supabase.from("vocabulary").upsert(batch, {
			onConflict: "set_id, hanzi",
			ignoreDuplicates: false,
		});
		if (error) throw new Error(`Failed to seed vocabulary: ${error.message}`);
		console.log(`  -> progress: ${Math.min(i + BATCH, data.length)}/${data.length}`);
	}
	console.log(`  -> ${data.length} words (${14114 - data.length} duplicates skipped)`);
}

async function seedPhonetic() {
	console.log("Seeding phonetic...");
	const raw: any[][] = JSON.parse(
		fs.readFileSync(path.join(root, "data", "phonetic.json"), "utf-8"),
	);

	const data: {
		row_idx: number;
		col_idx: number;
		text: string[];
		type: number;
		audio: (string | null)[];
		join_text: string;
		original_id: string;
		filename: string;
		is_null: boolean;
	}[] = [];

	for (let r = 0; r < raw.length; r++) {
		for (let c = 0; c < raw[r].length; c++) {
			const cell = raw[r][c];
			if (!cell) continue;
			data.push({
				row_idx: r,
				col_idx: c,
				text: cell.text ?? [],
				type: cell.type ?? 0,
				audio: cell.audio ?? [],
				join_text: cell.join ?? "",
				original_id: cell.originalId ?? "",
				filename: cell.filename ?? "",
				is_null: cell.isNull ?? false,
			});
		}
	}

	for (let i = 0; i < data.length; i += BATCH) {
		const batch = data.slice(i, i + BATCH);
		const { error } = await supabase.from("phonetic").upsert(batch, {
			onConflict: "id",
			ignoreDuplicates: false,
		});
		if (error) throw new Error(`Failed to seed phonetic: ${error.message}`);
	}
	console.log(`  -> ${data.length} phonetic cells`);
}

async function main() {
	console.log("=== Seeding Supabase ===\n");
	const start = Date.now();

	try {
		await seedPaths();
		await seedStudySets();
		await seedVocabulary();
		await seedPhonetic();
		console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
	} catch (err) {
		console.error("Seed failed:", err);
		process.exit(1);
	}
}

main();
