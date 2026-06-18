import { Volume2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getMasteryInfo, getMasteryLevel } from "@/lib/srs";
import type { WordWithReview } from "@/lib/types";

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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Chi tiết từ vựng</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col items-center gap-4">
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
							<Volume2 size={18} className={playing ? "animate-pulse" : ""} />
						</button>
					</div>

					<p className="text-lg text-muted-foreground">{word.pinyin}</p>
					<p className="text-base font-medium">{word.meaning}</p>

					<Badge variant={info.variant}>{info.label}</Badge>

					<div className="w-full space-y-2 text-sm">
						{word.radical && (
							<div className="flex gap-2">
								<span className="text-muted-foreground shrink-0 w-16">
									Bộ thủ
								</span>
								<span>{word.radical}</span>
							</div>
						)}
						{word.etymology && (
							<div className="flex gap-2">
								<span className="text-muted-foreground shrink-0 w-16">
									Chiết tự
								</span>
								<span className="text-muted-foreground">{word.etymology}</span>
							</div>
						)}
						{word.example && (
							<div className="flex gap-2">
								<span className="text-muted-foreground shrink-0 w-16">
									Ví dụ
								</span>
								<span className="italic">{word.example}</span>
							</div>
						)}
						{review && (
							<>
								<div className="flex gap-2">
									<span className="text-muted-foreground shrink-0 w-16">
										Đã học
									</span>
									<span>{review.total_reviews} lần</span>
								</div>
								{nextReview && (
									<div className="flex gap-2">
										<span className="text-muted-foreground shrink-0 w-16">
											Ôn tiếp
										</span>
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
							</>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
