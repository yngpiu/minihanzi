import { Eye, EyeOff, Search, Trash2, Volume2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteWord, useWords } from "@/hooks/queries";
import { getMasteryInfo, getMasteryLevel } from "@/lib/srs";
import type { WordWithReview } from "@/lib/types";
import { AddWordDialog } from "./AddWordDialog";
import { AIAddWordDialog } from "./AIAddWordDialog";
import { WordDetailDialog } from "./WordDetailDialog";

type FilterValue =
	| "all"
	| "unstudied"
	| "learning"
	| "reviewing"
	| "familiar"
	| "mastered";

const FILTER_LABELS: Record<FilterValue, string> = {
	all: "Tất cả",
	unstudied: "Chưa học",
	learning: "Đang học",
	reviewing: "Cần ôn",
	familiar: "Quen",
	mastered: "Đã thuộc",
};

export function VocabTable() {
	const { data: words, isLoading, error } = useWords();
	const { mutate: deleteWord } = useDeleteWord();
	const [hidePinyin, setHidePinyin] = useState(false);
	const [hideMeaning, setHideMeaning] = useState(false);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FilterValue>("all");
	const [detailWord, setDetailWord] = useState<string | null>(null);

	const filtered = useMemo(() => {
		if (!words) return [];
		return words.filter((w) => {
			if (filter !== "all") {
				const level = getMasteryLevel(
					w.word_review?.interval_level ?? 0,
					w.word_review?.total_reviews ?? 0,
				);
				if (level !== filter) return false;
			}
			if (search.trim()) {
				const q = search.toLowerCase().trim();
				if (
					!w.hanzi.includes(q) &&
					!w.pinyin.toLowerCase().includes(q) &&
					!w.meaning.toLowerCase().includes(q)
				)
					return false;
			}
			return true;
		});
	}, [words, filter, search]);

	const selectedWord = useMemo(
		() => words?.find((w) => w.id === detailWord) ?? null,
		[words, detailWord],
	);

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
			</div>
		);
	}

	if (error) {
		console.error("[VocabTable]", error);
		return (
			<div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
				<p className="text-destructive text-sm">{error.message}</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative flex-1 min-w-[200px]">
						<Search
							size={14}
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
						/>
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Tìm kiếm chữ Hán, pinyin, nghĩa..."
							className="pl-8 pr-8"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X size={14} />
							</button>
						)}
					</div>

					<Select
						value={filter}
						onValueChange={(v: FilterValue) => setFilter(v)}
					>
						<SelectTrigger className="w-[130px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(FILTER_LABELS).map(([k, v]) => (
								<SelectItem key={k} value={k}>
									{v}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setHidePinyin(!hidePinyin)}
						className="shrink-0"
					>
						{hidePinyin ? <EyeOff size={14} /> : <Eye size={14} />}
						Pinyin
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setHideMeaning(!hideMeaning)}
						className="shrink-0"
					>
						{hideMeaning ? <EyeOff size={14} /> : <Eye size={14} />}
						Nghĩa
					</Button>

					<AddWordDialog />
					<AIAddWordDialog />
				</div>

				{filtered.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						{search || filter !== "all"
							? "Không tìm thấy từ nào phù hợp."
							: "Chưa có từ vựng nào. Hãy thêm từ đầu tiên!"}
					</div>
				) : (
					<>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>
								Hiển thị {filtered.length}/{words?.length ?? 0} từ
							</span>
							{filter !== "all" && (
								<button
									type="button"
									onClick={() => setFilter("all")}
									className="hover:text-foreground transition-colors underline underline-offset-2"
								>
									Xoá bộ lọc
								</button>
							)}
						</div>
						<div className="overflow-x-auto rounded-xl border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50 text-left text-muted-foreground">
										<th className="p-3 font-medium w-10">STT</th>
										<th className="p-3 font-medium">Chữ Hán</th>
										<th className="p-3 font-medium">Pinyin</th>
										<th className="p-3 font-medium">Nghĩa</th>
										<th className="p-3 font-medium hidden md:table-cell">
											Bộ thủ
										</th>
										<th className="p-3 font-medium hidden sm:table-cell">
											Trình độ
										</th>
										<th className="p-3 font-medium hidden lg:table-cell">
											Ôn tiếp
										</th>
										<th className="p-3 font-medium w-20" />
									</tr>
								</thead>
								<tbody>
									{filtered.map((w, i) => (
										<VocabRow
											key={w.id}
											word={w}
											index={i + 1}
											hidePinyin={hidePinyin}
											hideMeaning={hideMeaning}
											onDetail={() => setDetailWord(w.id)}
											onDelete={() => deleteWord(w.id)}
										/>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}
			</div>

			<WordDetailDialog
				word={selectedWord}
				open={detailWord !== null}
				onOpenChange={(open) => {
					if (!open) setDetailWord(null);
				}}
			/>
		</>
	);
}

function VocabRow({
	word,
	index,
	hidePinyin,
	hideMeaning,
	onDetail,
	onDelete,
}: {
	word: WordWithReview;
	index: number;
	hidePinyin: boolean;
	hideMeaning: boolean;
	onDetail: () => void;
	onDelete: () => void;
}) {
	const [playing, setPlaying] = useState(false);

	const speak = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (playing) return;
			if (!window.speechSynthesis) return;
			setPlaying(true);
			const u = new SpeechSynthesisUtterance(word.hanzi);
			u.lang = "zh-CN";
			u.rate = 0.9;
			u.onend = () => setPlaying(false);
			u.onerror = () => setPlaying(false);
			window.speechSynthesis.speak(u);
		},
		[word.hanzi, playing],
	);

	const review = word.word_review;
	const level = getMasteryLevel(
		review?.interval_level ?? 0,
		review?.total_reviews ?? 0,
	);
	const info = getMasteryInfo(level);
	const nextReview = review?.next_review_at;
	const isOverdue = nextReview && new Date(nextReview) <= new Date();

	return (
		<tr
			className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
			onClick={onDetail}
		>
			<td className="p-3 text-muted-foreground tabular-nums">{index}</td>
			<td className="p-3">
				<span className="flex items-center gap-1.5">
					<span className="font-kai text-lg leading-none">{word.hanzi}</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={speak}
									className={`shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors ${
										playing ? "text-primary" : ""
									}`}
								>
									<Volume2
										size={13}
										className={playing ? "animate-pulse" : ""}
									/>
								</button>
							</TooltipTrigger>
							<TooltipContent>Phát âm</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</span>
			</td>
			<td className="p-3">
				{hidePinyin ? (
					<span
						className="opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
						role="none"
					>
						{"•".repeat(word.pinyin.length)}
					</span>
				) : (
					word.pinyin
				)}
			</td>
			<td className="p-3">
				<span
					className={
						hideMeaning
							? "opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
							: ""
					}
				>
					{hideMeaning
						? Array.from({ length: Math.min(word.meaning.length, 10) })
								.map(() => "•")
								.join("")
						: word.meaning}
				</span>
			</td>
			<td className="p-3 hidden md:table-cell text-muted-foreground">
				{word.radical_components && word.radical_components.length > 0
					? word.radical_components.map((c) => c.char).join(" ")
					: word.radical || "—"}
			</td>
			<td className="p-3 hidden sm:table-cell">
				<Badge variant={info.variant}>{info.label}</Badge>
			</td>
			<td className="p-3 hidden lg:table-cell">
				{nextReview ? (
					<span
						className={
							isOverdue
								? "text-destructive text-xs"
								: "text-xs text-muted-foreground"
						}
					>
						{new Date(nextReview).toLocaleDateString("vi-VN")}
						{isOverdue && " (quá hạn)"}
					</span>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="p-3">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-xs"
								className="text-muted-foreground hover:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
							>
								<Trash2 />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Xoá từ</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</td>
		</tr>
	);
}
