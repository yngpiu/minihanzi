import { BookOpen, PenLine, TreePine, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanjiTile } from "@/components/word-entry/KanjiTile";
import { getMasteryInfo, getMasteryLevel } from "@/lib/srs";
import type { WordWithReview } from "@/lib/types";
import { ExampleDisplay } from "./ExampleDisplay";
import { RadicalTree } from "./RadicalTree";

interface Props {
	word: WordWithReview | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WordDetailDialog({ word, open, onOpenChange }: Props) {
	const [playing, setPlaying] = useState(false);

	const speak = useCallback(() => {
		if (playing || !word) return;
		if (!window.speechSynthesis) return;
		setPlaying(true);
		const u = new SpeechSynthesisUtterance(word.hanzi);
		u.lang = "zh-CN";
		u.rate = 0.9;
		u.onend = () => setPlaying(false);
		u.onerror = () => setPlaying(false);
		window.speechSynthesis.speak(u);
	}, [word, playing]);

	if (!word) return null;

	const review = word.word_review;
	const level = getMasteryLevel(
		review?.interval_level ?? 0,
		review?.total_reviews ?? 0,
	);
	const info = getMasteryInfo(level);
	const nextReview = review?.next_review_at;
	const isOverdue = nextReview && new Date(nextReview) <= new Date();

	const chars = [...new Set(word.hanzi.split(""))];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Chi tiết từ vựng</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue="meaning">
					<TabsList>
						<TabsTrigger value="meaning">
							<BookOpen data-icon="inline-start" />
							Nghĩa
						</TabsTrigger>
						<TabsTrigger value="radical">
							<TreePine data-icon="inline-start" />
							Bộ thủ
						</TabsTrigger>
						<TabsTrigger value="writing">
							<PenLine data-icon="inline-start" />
							Luyện viết
						</TabsTrigger>
					</TabsList>

					{/* Tab 1: Nghĩa */}
					<TabsContent value="meaning" className="mt-4 space-y-4">
						<div className="flex flex-col items-center gap-3">
							<div className="flex items-center gap-3">
								<p className="text-5xl font-kai select-none">{word.hanzi}</p>
								<button
									type="button"
									onClick={speak}
									className={`flex items-center justify-center size-10 rounded-full border transition-colors ${
										playing
											? "border-primary bg-primary/10 text-primary"
											: "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
									title="Phát âm"
								>
									<Volume2
										size={18}
										className={playing ? "animate-pulse" : ""}
									/>
								</button>
							</div>

							<p className="text-lg text-muted-foreground">{word.pinyin}</p>
							<p className="text-base font-medium">{word.meaning}</p>

							<Badge variant={info.variant}>{info.label}</Badge>
						</div>

						<div className="w-full space-y-3 text-sm">
							{word.etymology && (
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs font-medium">
										Chiết tự
									</span>
									<p className="text-muted-foreground">{word.etymology}</p>
								</div>
							)}

							{word.example_data ? (
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs font-medium">
										Ví dụ
									</span>
									<div className="rounded-lg border bg-muted/30 p-3">
										<ExampleDisplay data={word.example_data} />
									</div>
								</div>
							) : word.example ? (
								<div className="flex gap-2">
									<span className="text-muted-foreground shrink-0 w-16">
										Ví dụ
									</span>
									<span className="italic">{word.example}</span>
								</div>
							) : null}

							{review && (
								<div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
									<div className="flex gap-2">
										<span className="shrink-0">Đã học</span>
										<span>{review.total_reviews} lần</span>
									</div>
									{nextReview && (
										<div className="flex gap-2">
											<span className="shrink-0">Ôn tiếp</span>
											<span
												className={
													isOverdue ? "text-destructive font-medium" : ""
												}
											>
												{new Date(nextReview).toLocaleDateString("vi-VN")}
												{isOverdue && " (quá hạn)"}
											</span>
										</div>
									)}
								</div>
							)}
						</div>
					</TabsContent>

					{/* Tab 2: Bộ thủ */}
					<TabsContent value="radical" className="mt-4 space-y-4">
						{word.radical_components && word.radical_components.length > 0 ? (
							<div className="overflow-x-auto pb-2">
								<RadicalTree
									node={{
										char: word.hanzi,
										pinyin: word.pinyin,
										meaning: word.meaning,
										role: "",
										children: word.radical_components,
									}}
									isRoot
								/>
							</div>
						) : word.radical ? (
							<div className="flex gap-2 text-sm">
								<span className="text-muted-foreground shrink-0">Bộ thủ:</span>
								<span>{word.radical}</span>
							</div>
						) : (
							<p className="text-sm text-muted-foreground italic">
								Không có dữ liệu bộ thủ.
							</p>
						)}

						{word.etymology && (
							<div className="border-t pt-3 space-y-1 text-sm">
								<span className="text-muted-foreground text-xs font-medium">
									Chiết tự
								</span>
								<p className="text-muted-foreground">{word.etymology}</p>
							</div>
						)}
					</TabsContent>

					{/* Tab 3: Luyện viết */}
					<TabsContent value="writing" className="mt-4">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
							{chars.map((ch) => (
								<KanjiTile key={ch} char={ch} />
							))}
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
