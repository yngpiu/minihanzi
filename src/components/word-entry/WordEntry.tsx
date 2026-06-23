import { BookOpen, Bot, GitCompare, Hash, Layers, Repeat } from "lucide-react";
import { memo, useId, useState } from "react";
import { AudioBtn } from "@/components/AudioBtn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatGPT, useKanjiSearch } from "@/hooks/queries";
import type { WordResult } from "@/services/types";
import {
	getImageUrl,
	getKaraokeTokens,
	getUniqueChars,
	translateKind,
} from "@/services/utils";
import { AIPanel } from "./AIPanel";
import { ExItem } from "./ExItem";
import { KanjiTile } from "./KanjiTile";

interface Props {
	word: WordResult;
	onSearch?: (q: string) => void;
}

function WordEntryImpl({ word, onSearch }: Props) {
	const chars = word.word ? getUniqueChars(word.word) : [];
	const tokens = word.word ? getKaraokeTokens(word.word) : [];

	const { data: kanjiData, isLoading: kanjiLoading } = useKanjiSearch(chars);
	const chatGptQuery = useChatGPT(word.word, word.pinyin);
	const hasAiData =
		chatGptQuery.isLoading ||
		(chatGptQuery.data?.found &&
			(chatGptQuery.data?.result?.[0]?.chat_gpt?.length ?? 0) > 0);

	const kanjiMap = new Map();
	if (kanjiData) {
		for (const resp of kanjiData) {
			if (resp.found && resp.result?.[0]) {
				kanjiMap.set(resp.query, resp.result[0]);
			}
		}
	}

	const fallbackWid = useId();
	const wid = `w-${word._id || word.id || fallbackWid}`;
	const means = word.search_all_means || [];
	const syno = word.snym?.syno || [];
	const anto = word.snym?.anto || [];
	const compounds = word.compound
		? word.compound.split(";").filter(Boolean)
		: [];
	const content = word.content || [];
	const hasCompound = compounds.length > 0;
	const hasKanji = chars.length > 0;
	const hasCompare = (word.compare || []).length > 0;
	const hasSynoAnto = syno.length > 0 || anto.length > 0;
	const hasGrammar = content.some((c) => (c.structs || []).length > 0);
	const grammarCount = content.reduce(
		(s, c) => s + (c.structs || []).length,
		0,
	);

	const tabs = [
		{
			id: "meaning",
			label: "Nghĩa",
			icon: <BookOpen size={14} />,
			count:
				content.reduce((s, c) => s + (c.means?.length || 0), 0) || means.length,
		},
		...(hasGrammar
			? [
					{
						id: "grammar",
						label: "Ngữ pháp",
						icon: <Hash size={14} />,
						count: grammarCount,
					},
				]
			: []),
		...(hasCompound
			? [
					{
						id: "compound",
						label: "Từ ghép",
						icon: <Hash size={14} />,
						count: compounds.length,
					},
				]
			: []),
		...(hasSynoAnto
			? [
					{
						id: "synoanto",
						label: "Đồng/trái nghĩa",
						icon: <Repeat size={14} />,
						count: syno.length + anto.length,
					},
				]
			: []),
		...(hasKanji
			? [
					{
						id: "kanji",
						label: "Hán tự",
						icon: <Layers size={14} />,
						count: chars.length,
					},
				]
			: []),
		...(hasCompare
			? [
					{
						id: "compare",
						label: "So sánh",
						icon: <GitCompare size={14} />,
						count: word.compare?.length,
					},
				]
			: []),
		...(hasAiData
			? [
					{
						id: "ai",
						label: "AI",
						icon: <Bot size={14} />,
						count: chatGptQuery.data?.result?.[0]?.chat_gpt?.length ?? 0,
					},
				]
			: []),
	];
	const [activeTab, setActiveTab] = useState("meaning");

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span id={wid} className="text-4xl font-serif tracking-wider">
								{tokens.map((t, i) => (
									<span key={i}>{t.w}</span>
								))}
							</span>
							{word.id && (
								<AudioBtn id={word.id} audioType="cnvi" containerId={wid} />
							)}
						</div>

						{word.pinyin && (
							<div className="text-lg text-muted-foreground">{word.pinyin}</div>
						)}

						<div className="flex flex-wrap items-center gap-1.5">
							{word.lv_hsk_new && (
								<Badge variant="secondary">HSK {word.lv_hsk_new}</Badge>
							)}
							{word.lv_tocfl && (
								<Badge variant="secondary">TOCFL {word.lv_tocfl}</Badge>
							)}
						</div>
					</div>

					{word.word && (
						<img
							src={getImageUrl(word.word)}
							alt={word.word}
							className="size-20 rounded-lg object-cover border"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = "none";
							}}
						/>
					)}
				</div>
			</CardHeader>

			<CardContent>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<div className="md:hidden mb-4">
						<Select value={activeTab} onValueChange={setActiveTab}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{tabs.map((t) => (
									<SelectItem key={t.id} value={t.id}>
										<span className="flex items-center gap-2">
											{t.icon} {t.label}
											{t.count > 0 && (
												<Badge
													variant="secondary"
													className="ml-auto text-[10px] px-1.5 py-0"
												>
													{t.count}
												</Badge>
											)}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<TabsList className="mb-4 hidden md:flex">
						{tabs.map((t) => (
							<TabsTrigger key={t.id} value={t.id} className="gap-1.5">
								{t.icon} {t.label}
								{t.count > 0 && (
									<Badge
										variant="secondary"
										className="ml-0.5 text-[10px] px-1.5 py-0"
									>
										{t.count}
									</Badge>
								)}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="meaning" className="mt-0 space-y-4">
						{means.length > 0 && content.length === 0 && (
							<div className="flex flex-wrap gap-1.5">
								{means.map((m) => (
									<Badge key={m} variant="secondary" className="text-xs">
										{m}
									</Badge>
								))}
							</div>
						)}

						{content.length > 0 &&
							content.map((c, ci) => (
								<div key={ci} className="space-y-3">
									{c.kind && (
										<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
											{translateKind(c.kind)}
										</p>
									)}
									{(c.means || []).map((m, mi) => (
										<div key={mi} className="flex gap-3">
											<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
												{mi + 1}
											</span>
											<div className="space-y-1 min-w-0 flex-1">
												<p className="text-sm font-medium">{m.mean}</p>
												{m.explain && (
													<p className="text-xs text-muted-foreground">
														{m.explain}
													</p>
												)}

												{(m.examples || []).slice(0, 3).length > 0 && (
													<div className="space-y-2 pt-1">
														{(m.examples || []).slice(0, 3).map((ex, ei) => (
															<ExItem key={ei} ex={ex} />
														))}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							))}
					</TabsContent>

					<TabsContent value="grammar" className="mt-0 space-y-3">
						{content.map((c, ci) =>
							(c.structs || []).length > 0 ? (
								<div key={ci} className="space-y-3">
									{(c.structs || []).map((st, si) => (
										<div
											key={si}
											className="space-y-2 rounded-lg border bg-muted/30 p-3"
										>
											{st.struct && (
												<code className="block text-sm font-mono bg-background rounded px-2 py-1 border">
													{st.struct}
												</code>
											)}
											{st.explain && <p className="text-sm">{st.explain}</p>}
											{(st.examples || []).slice(0, 2).map((ex, ei) => (
												<ExItem key={ei} ex={ex} />
											))}
										</div>
									))}
								</div>
							) : null,
						)}
					</TabsContent>

					<TabsContent value="compound" className="mt-0 space-y-3">
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Từ ghép
							</p>
							<div className="flex flex-wrap gap-1.5">
								{compounds.map((c) => (
									<Button
										key={c}
										variant="outline"
										size="xs"
										onClick={() => onSearch?.(c)}
									>
										{c}
									</Button>
								))}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="synoanto" className="mt-0 space-y-4">
						{syno.length > 0 && (
							<div className="space-y-1.5">
								<p className="text-xs font-medium text-muted-foreground">
									Từ đồng nghĩa
								</p>
								<div className="flex flex-wrap gap-1.5">
									{syno.map((s) => (
										<Button
											key={s}
											variant="outline"
											size="xs"
											onClick={() => onSearch?.(s)}
										>
											{s}
										</Button>
									))}
								</div>
							</div>
						)}
						{anto.length > 0 && (
							<div className="space-y-1.5">
								<p className="text-xs font-medium text-muted-foreground">
									Từ trái nghĩa
								</p>
								<div className="flex flex-wrap gap-1.5">
									{anto.map((s) => (
										<Button
											key={s}
											variant="outline"
											size="xs"
											onClick={() => onSearch?.(s)}
										>
											{s}
										</Button>
									))}
								</div>
							</div>
						)}
					</TabsContent>

					<TabsContent value="kanji" className="mt-0">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{chars.map((ch) => (
								<KanjiTile
									key={ch}
									char={ch}
									detail={kanjiMap.get(ch)}
									loading={kanjiLoading}
								/>
							))}
						</div>
					</TabsContent>

					<TabsContent value="compare" className="mt-0 space-y-3">
						{(word.compare || []).map((cp, i) => (
							<div
								key={i}
								className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4"
							>
								<p className="font-medium text-sm">{cp.title}</p>
								{cp.words && cp.words.length > 0 && (
									<div className="flex flex-wrap gap-1.5">
										{cp.words.map((w) => (
											<Badge key={w} variant="outline" className="font-serif">
												{w}
											</Badge>
										))}
									</div>
								)}
								{cp.mean_vi && (
									<p className="text-sm text-muted-foreground">{cp.mean_vi}</p>
								)}
							</div>
						))}
					</TabsContent>

					<TabsContent value="ai" className="mt-0">
						<AIPanel
							data={chatGptQuery.data}
							isLoading={chatGptQuery.isLoading}
							isError={chatGptQuery.isError}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

const WordEntry = memo(WordEntryImpl);
export { WordEntry };
