import {
	ArrowLeft,
	BookOpen,
	Eye,
	Loader2,
	PenLine,
	RotateCw,
	Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDueWords, useReviewWord } from "@/hooks/queries";
import { getMasteryInfo, getMasteryLevel } from "@/lib/srs";
import type { WordWithReview } from "@/lib/types";
import { HanziWriterDisplay } from "./HanziWriter";

type CardState = "front" | "back";

type ReviewMode = "recognition" | "recall" | "pinyin" | "writing";

interface FlashcardQueueItem {
	word: WordWithReview;
	localKey: number;
}

interface FlashcardProps {
	onComplete?: () => void;
	compact?: boolean;
}

const MODE_META: Record<
	ReviewMode,
	{
		label: string;
		icon: typeof BookOpen;
		description: string;
	}
> = {
	recognition: {
		label: "Nhận diện",
		icon: Eye,
		description: "Xem chữ Hán → nhớ nghĩa + pinyin",
	},
	recall: {
		label: "Gợi nhớ",
		icon: BookOpen,
		description: "Xem nghĩa → nhớ chữ Hán + pinyin",
	},
	pinyin: {
		label: "Phiên âm",
		icon: Volume2,
		description: "Xem chữ Hán → nhớ pinyin + nghĩa",
	},
	writing: {
		label: "Viết tay",
		icon: PenLine,
		description: "Luyện viết chữ Hán theo nét",
	},
};

export function Flashcard({ onComplete, compact }: FlashcardProps) {
	const { data: words, isLoading, error } = useDueWords();
	const { mutate: reviewWord, isPending: isReviewing } = useReviewWord();

	const [mode, setMode] = useState<ReviewMode>("recognition");
	const [sessionStarted, setSessionStarted] = useState(false);
	const [cardState, setCardState] = useState<CardState>("front");
	const [queue, setQueue] = useState<FlashcardQueueItem[]>([]);
	const [currentIdx, setCurrentIdx] = useState(0);
	const [rated, setRated] = useState(false);

	const currentWord = queue[currentIdx]?.word;
	const isDone =
		!isLoading &&
		!error &&
		(!words || words.length === 0) &&
		queue.length === 0;
	const isSessionDone =
		!isLoading && queue.length > 0 && currentIdx >= queue.length;

	useEffect(() => {
		if (!words || words.length === 0) return;
		setQueue(
			words.map((w) => ({ word: w, localKey: Date.now() + Math.random() })),
		);
		setCurrentIdx(0);
		setCardState("front");
		setRated(false);
	}, [words]);

	function handleFlip() {
		setCardState("back");
	}

	function handleRate(grade: 0 | 1 | 2) {
		if (!currentWord || rated) return;
		setRated(true);

		reviewWord(
			{ wordId: currentWord.id, grade },
			{
				onSuccess: () => {
					if (grade === 0) {
						setQueue((prev) => [
							...prev,
							{
								word: currentWord,
								localKey: Date.now() + Math.random(),
							},
						]);
					}
					setTimeout(() => {
						setCurrentIdx((prev) => prev + 1);
						setCardState("front");
						setRated(false);
					}, 400);
				},
			},
		);
	}

	const reviewEl = useRef<HTMLDivElement>(null);
	const containerClass = compact ? "min-h-[50vh]" : "min-h-[60vh]";

	if (isLoading) {
		return (
			<div className={`flex items-center justify-center ${containerClass}`}>
				<Loader2 size={32} className="animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		console.error("[Flashcard]", error);
		return (
			<div
				className={`flex flex-col items-center justify-center ${containerClass} gap-2 text-center px-4`}
			>
				<p className="text-destructive text-sm">{error.message}</p>
				{onComplete && (
					<Button variant="outline" size="sm" onClick={onComplete}>
						<ArrowLeft size={14} />
						Quay lại
					</Button>
				)}
			</div>
		);
	}

	if (isDone) {
		return (
			<div
				className={`flex flex-col items-center justify-center ${containerClass} gap-4 text-center px-4`}
			>
				<div className="text-8xl font-kai text-green-500/60 select-none">
					完
				</div>
				<h2 className="text-2xl font-bold">Hoàn thành!</h2>
				<p className="text-muted-foreground">
					Bạn đã học xong tất cả từ hôm nay.
				</p>
				{onComplete && (
					<Button variant="outline" onClick={onComplete}>
						<ArrowLeft size={14} />
						Quay lại Dashboard
					</Button>
				)}
			</div>
		);
	}

	if (isSessionDone) {
		const mastered = queue.filter((item) => {
			const lvl = item.word.word_review?.interval_level ?? 0;
			return lvl >= 4;
		}).length;

		return (
			<div
				className={`flex flex-col items-center justify-center ${containerClass} gap-4 text-center px-4`}
			>
				<div className="text-8xl font-kai text-green-500/60 select-none">
					完
				</div>
				<h2 className="text-2xl font-bold">Buổi học kết thúc!</h2>
				<p className="text-muted-foreground">
					Đã ôn {queue.length} từ, trong đó {mastered} từ đã quen.
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => {
							setSessionStarted(false);
							setQueue([]);
							setCurrentIdx(0);
						}}
					>
						<RotateCw size={14} />
						Học lại
					</Button>
					{onComplete && (
						<Button variant="outline" onClick={onComplete}>
							<ArrowLeft size={14} />
							Quay lại
						</Button>
					)}
				</div>
			</div>
		);
	}

	if (!sessionStarted) {
		return (
			<div
				className={`flex flex-col items-center justify-center ${containerClass} gap-6 text-center px-4 max-w-lg mx-auto`}
			>
				<div className="text-7xl font-kai text-primary/20 select-none">学</div>
				<h2 className="text-xl font-bold">Bắt đầu học</h2>
				<p className="text-sm text-muted-foreground">
					Chọn chế độ ôn tập cho buổi học này
				</p>

				<div className="grid grid-cols-2 gap-3 w-full">
					{(Object.keys(MODE_META) as ReviewMode[]).map((m) => {
						const meta = MODE_META[m];
						const Icon = meta.icon;
						const isActive = mode === m;
						return (
							<button
								type="button"
								key={m}
								onClick={() => setMode(m)}
								className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-left ${
									isActive
										? "border-primary bg-primary/5 ring-1 ring-primary/20"
										: "border-border hover:border-foreground/20 hover:bg-muted/30"
								}`}
							>
								<Icon
									size={20}
									className={
										isActive ? "text-primary" : "text-muted-foreground"
									}
								/>
								<div className="text-center">
									<p className="text-sm font-medium">{meta.label}</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{meta.description}
									</p>
								</div>
							</button>
						);
					})}
				</div>

				<Button
					size="lg"
					className="w-full"
					onClick={() => setSessionStarted(true)}
				>
					Bắt đầu ôn tập
				</Button>
			</div>
		);
	}

	if (!currentWord) {
		return (
			<div
				className={`flex flex-col items-center justify-center ${containerClass} gap-4 text-center px-4`}
			>
				<div className="text-8xl font-kai text-primary/20 select-none">学</div>
				<h2 className="text-xl font-bold">Chưa có từ cần ôn</h2>
				<p className="text-muted-foreground">
					Thêm từ vựng mới vào kho để bắt đầu học.
				</p>
				{onComplete && (
					<Button variant="outline" onClick={onComplete}>
						<ArrowLeft size={14} />
						Quay lại
					</Button>
				)}
			</div>
		);
	}

	const totalCards = queue.length;
	const progressText = `${currentIdx + 1} / ${totalCards}`;

	const masteryInfo = getMasteryInfo(
		getMasteryLevel(
			currentWord.word_review?.interval_level ?? 0,
			currentWord.word_review?.total_reviews ?? 0,
		),
	);

	return (
		<div
			ref={reviewEl}
			className={`flex flex-col items-center ${compact ? "" : "min-h-[60vh]"} gap-6 px-4 max-w-lg mx-auto`}
		>
			<div className="w-full flex items-center justify-between text-sm text-muted-foreground">
				<div className="flex items-center gap-2">
					<span>{MODE_META[mode].label}</span>
					<Badge variant={masteryInfo.variant}>{masteryInfo.label}</Badge>
				</div>
				<span className="tabular-nums">{progressText}</span>
			</div>

			<Card className="w-full p-6 flex flex-col items-center gap-6 min-h-[360px] justify-center">
				{cardState === "front" ? (
					<FrontSide mode={mode} word={currentWord} onFlip={handleFlip} />
				) : (
					<BackSide
						word={currentWord}
						onRate={handleRate}
						isReviewing={isReviewing}
						rated={rated}
					/>
				)}
			</Card>
		</div>
	);
}

function FrontSide({
	mode,
	word,
	onFlip,
}: {
	mode: ReviewMode;
	word: WordWithReview;
	onFlip: () => void;
}) {
	return (
		<>
			<p className="text-xs text-muted-foreground uppercase tracking-wider">
				{mode === "recognition" && "Nhìn chữ Hán → Nhớ nghĩa"}
				{mode === "recall" && "Nhìn nghĩa → Nhớ chữ Hán"}
				{mode === "pinyin" && "Nhìn chữ Hán → Nhớ pinyin"}
				{mode === "writing" && "Tập viết chữ Hán"}
			</p>

			{mode === "recognition" ? (
				<WordDisplay hanzi={word.hanzi} />
			) : mode === "recall" ? (
				<MeaningDisplay meaning={word.meaning} />
			) : mode === "pinyin" ? (
				<WordDisplay hanzi={word.hanzi} />
			) : (
				<WritingFront char={word.hanzi} />
			)}

			<Button onClick={onFlip} size="lg" className="mt-2">
				<RotateCw size={16} />
				Xem đáp án
			</Button>
		</>
	);
}

function BackSide({
	word,
	onRate,
	isReviewing,
	rated,
}: {
	mode: ReviewMode;
	word: WordWithReview;
	onRate: (grade: 0 | 1 | 2) => void;
	isReviewing: boolean;
	rated: boolean;
}) {
	return (
		<>
			<p className="text-xs text-muted-foreground uppercase tracking-wider">
				Đáp án
			</p>

			<div className="space-y-2 text-center">
				<p className="text-7xl md:text-8xl font-kai leading-tight select-none">
					{word.hanzi}
				</p>
				<p className="text-xl text-muted-foreground">{word.pinyin}</p>
				<p className="text-lg font-medium">{word.meaning}</p>
				{word.radical && (
					<p className="text-sm text-muted-foreground">
						Bộ thủ: {word.radical}
					</p>
				)}
				{word.etymology && (
					<p className="text-sm text-muted-foreground max-w-sm">
						{word.etymology}
					</p>
				)}
				{word.example && (
					<p className="text-sm text-muted-foreground italic mt-2">
						Ví dụ: {word.example}
					</p>
				)}
			</div>

			<div className="flex gap-2 mt-4 w-full max-w-sm">
				<Button
					variant="destructive"
					className="flex-1"
					onClick={() => onRate(0)}
					disabled={isReviewing || rated}
				>
					Quên
				</Button>
				<Button
					variant="secondary"
					className="flex-1"
					onClick={() => onRate(1)}
					disabled={isReviewing || rated}
				>
					Nhớ sơ
				</Button>
				<Button
					variant="default"
					className="flex-1"
					onClick={() => onRate(2)}
					disabled={isReviewing || rated}
				>
					Đã thuộc
				</Button>
			</div>
		</>
	);
}

function WordDisplay({ hanzi }: { hanzi: string }) {
	return (
		<p className="text-7xl md:text-8xl font-kai leading-tight select-none">
			{hanzi}
		</p>
	);
}

function MeaningDisplay({ meaning }: { meaning: string }) {
	return (
		<div className="text-center space-y-1">
			<p className="text-3xl font-medium">{meaning}</p>
			<p className="text-xs text-muted-foreground">
				Viết lại chữ Hán tương ứng
			</p>
		</div>
	);
}

function WritingFront({ char }: { char: string }) {
	return (
		<div className="flex flex-col items-center gap-3">
			<HanziWriterDisplay
				char={char[0]}
				width={180}
				height={180}
				autoPlay={true}
			/>
			<p className="text-xs text-muted-foreground">
				Xem hướng dẫn nét, sau đó nhấn "Xem đáp án"
			</p>
		</div>
	);
}
