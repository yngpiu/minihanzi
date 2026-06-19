import { ArrowLeft, Loader2, RotateCw, Speaker } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDueWords, useReviewWord, useWords } from "@/hooks/queries";
import {
	dbToCard,
	type FSRSGrade,
	getMasteryInfo,
	getMasteryLevel,
	getRatingColors,
	getRatingFromKey,
	getRatingKey,
	getRatingLabel,
	Rating,
} from "@/lib/fsrs";
import { pinyinMatch } from "@/lib/normalize-pinyin";
import { applyPinyinIME } from "@/lib/pinyin-ime";
import type {
	ExerciseState,
	FSRSRating,
	InteractiveMode,
	WordWithReview,
} from "@/lib/types";

// ─── Types ───────────────────────────────────────────────

interface SessionStat {
	correct: boolean;
	rating: FSRSRating;
	mode: InteractiveMode;
}

interface QueueItem {
	word: WordWithReview;
	localKey: number;
	assignedMode: InteractiveMode;
}

// ─── Constants ───────────────────────────────────────────

const MODE_META: Record<
	InteractiveMode,
	{ label: string; description: string }
> = {
	"pinyin-input": {
		label: "Gõ pinyin",
		description: "Nhìn chữ Hán → gõ pinyin",
	},
	"hanzi-choice": {
		label: "Chọn chữ",
		description: "Xem pinyin + nghĩa → chọn chữ Hán đúng",
	},
	"listen-input": {
		label: "Nghe",
		description: "Nghe phát âm → gõ pinyin",
	},
	mixed: {
		label: "Hỗn hợp",
		description: "Trộn ngẫu nhiên các dạng bài",
	},
};

const ALL_EXERCISE_MODES: InteractiveMode[] = [
	"pinyin-input",
	"hanzi-choice",
	"listen-input",
];

// ─── Helpers ─────────────────────────────────────────────

function _normalizeAnswer(s: string): string {
	return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function getExerciseForCard(
	_word: WordWithReview,
	sessionMode: InteractiveMode,
): InteractiveMode {
	if (sessionMode !== "mixed") return sessionMode;
	const available = [...ALL_EXERCISE_MODES];
	return available[Math.floor(Math.random() * available.length)];
}

function generateDistractors(
	correctHanzi: string,
	pool: WordWithReview[],
	count = 3,
): string[] {
	const others = pool
		.filter((w) => w.hanzi !== correctHanzi)
		.map((w) => w.hanzi);
	const shuffled = [...new Set(others)].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

function useSessionTime(startTime: number): string {
	const [elapsed, setElapsed] = useState(0);
	useEffect(() => {
		if (!startTime) return;
		const id = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startTime) / 1000));
		}, 1000);
		return () => clearInterval(id);
	}, [startTime]);
	const m = Math.floor(elapsed / 60);
	const s = elapsed % 60;
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Main Flashcard ──────────────────────────────────────

interface FlashcardProps {
	onComplete?: () => void;
	compact?: boolean;
}

export function Flashcard({ onComplete }: FlashcardProps) {
	const { data: words, isLoading, error } = useDueWords();
	const { data: allWords } = useWords();
	const { mutate: reviewWord, isPending: isReviewing } = useReviewWord();

	const [sessionMode, setSessionMode] =
		useState<InteractiveMode>("pinyin-input");
	const [sessionStarted, setSessionStarted] = useState(false);
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [currentIdx, setCurrentIdx] = useState(0);
	const [step, setStep] = useState<ExerciseState>("prompt");
	const [userAnswer, setUserAnswer] = useState("");
	const [stats, setStats] = useState<SessionStat[]>([]);
	const [sessionStartTime, setSessionStartTime] = useState(0);

	const sessionTime = useSessionTime(sessionStartTime);

	const current = queue[currentIdx];
	const isSessionDone =
		!isLoading && queue.length > 0 && currentIdx >= queue.length;
	const isDbEmpty =
		!isLoading &&
		!error &&
		(!words || words.length === 0) &&
		queue.length === 0;

	const distractorPool = useMemo(
		() => allWords ?? words ?? [],
		[allWords, words],
	);

	useEffect(() => {
		if (!words || words.length === 0 || sessionStarted) return;
		setQueue(
			words.map((w) => ({
				word: w,
				localKey: Date.now() + Math.random(),
				assignedMode: getExerciseForCard(w, sessionMode),
			})),
		);
		setCurrentIdx(0);
		setStep("prompt");
		setUserAnswer("");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [words, sessionMode, sessionStarted]);

	const advance = useCallback(() => {
		setCurrentIdx((prev) => prev + 1);
		setStep("prompt");
		setUserAnswer("");
	}, []);

	const handleSubmit = useCallback(
		(answer: string) => {
			if (!current) return;
			setUserAnswer(answer);
			setStep("answer");
		},
		[current],
	);

	const handleRate = useCallback(
		(grade: FSRSGrade) => {
			if (!current || isReviewing) return;
			const correct = checkAnswer(
				current.word,
				userAnswer,
				current.assignedMode,
			);
			setStats((prev) => [
				...prev,
				{ correct, rating: grade, mode: current.assignedMode },
			]);
			setStep("rated");

			reviewWord(
				{ wordId: current.word.id, grade },
				{
					onSuccess: () => {
						if (grade === Rating.Again) {
							setQueue((prev) => [
								...prev,
								{
									word: current.word,
									localKey: Date.now() + Math.random(),
									assignedMode: current.assignedMode,
								},
							]);
						}
						setTimeout(() => advance(), 300);
					},
				},
			);
		},
		[current, userAnswer, isReviewing, reviewWord, advance],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (step === "answer") {
				const rating = getRatingFromKey(e.key);
				if (rating !== null) {
					e.preventDefault();
					handleRate(rating);
				}
			}
		},
		[step, handleRate],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// ── Render states ──

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 size={32} className="animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2 text-center px-4">
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

	if (isDbEmpty) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
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
		const total = stats.length;
		const correct = stats.filter((s) => s.correct).length;
		const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
		const modeStats = stats.reduce(
			(acc, s) => {
				if (!acc[s.mode]) acc[s.mode] = { total: 0, correct: 0 };
				acc[s.mode].total++;
				if (s.correct) acc[s.mode].correct++;
				return acc;
			},
			{} as Record<string, { total: number; correct: number }>,
		);

		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
				<div className="text-8xl font-kai text-green-500/60 select-none">
					完
				</div>
				<h2 className="text-2xl font-bold">Buổi học kết thúc!</h2>
				<div className="space-y-1 text-sm text-muted-foreground">
					<p>
						Đã ôn {total} từ · Thời gian: {sessionTime}
					</p>
					<p>
						Đúng: {correct}/{total} ({accuracy}%)
					</p>
					{Object.entries(modeStats).map(([mode, ms]) => (
						<p key={mode} className="text-xs">
							{MODE_META[mode as InteractiveMode]?.label ?? mode}: {ms.correct}/
							{ms.total}
						</p>
					))}
				</div>
				<div className="flex gap-2 mt-2">
					<Button
						variant="outline"
						onClick={() => {
							setSessionStarted(false);
							setQueue([]);
							setCurrentIdx(0);
							setStats([]);
							setSessionStartTime(0);
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
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center px-4 max-w-lg mx-auto">
				<div className="text-7xl font-kai text-primary/20 select-none">学</div>
				<h2 className="text-xl font-bold">Bắt đầu học</h2>
				<p className="text-sm text-muted-foreground">
					Chọn dạng bài cho buổi học này
				</p>

				<div className="grid grid-cols-2 gap-3 w-full">
					{(Object.keys(MODE_META) as InteractiveMode[]).map((m) => {
						const meta = MODE_META[m];
						const isActive = sessionMode === m;
						return (
							<button
								type="button"
								key={m}
								onClick={() => setSessionMode(m)}
								className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-left ${
									isActive
										? "border-primary bg-primary/5 ring-1 ring-primary/20"
										: "border-border hover:border-foreground/20 hover:bg-muted/30"
								}`}
							>
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
					onClick={() => {
						setSessionStarted(true);
						setSessionStartTime(Date.now());
					}}
				>
					Bắt đầu ôn tập
				</Button>
			</div>
		);
	}

	if (!current) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
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

	const progress = `${currentIdx + 1} / ${queue.length}`;
	const fillPct =
		((currentIdx + (step !== "prompt" ? 1 : 0)) / queue.length) * 100;

	return (
		<div className="flex flex-col items-center gap-4 px-4 max-w-lg mx-auto w-full">
			<div className="w-full flex items-center justify-between text-sm text-muted-foreground">
				<div className="flex items-center gap-2">
					<span>{MODE_META[current.assignedMode]?.label ?? "Ôn tập"}</span>
					<SessionAccuracy stats={stats} />
				</div>
				<span className="tabular-nums">
					{progress} · {sessionTime}
				</span>
			</div>

			<div className="w-full bg-muted rounded-full h-1.5">
				<div
					className="bg-primary h-1.5 rounded-full transition-all duration-500"
					style={{ width: `${fillPct}%` }}
				/>
			</div>

			<Card className="w-full p-6 flex flex-col items-center gap-5 min-h-[340px] justify-center relative overflow-hidden">
				{step === "prompt" && (
					<ExercisePrompt
						mode={current.assignedMode}
						word={current.word}
						distractors={generateDistractors(
							current.word.hanzi,
							distractorPool,
						)}
						onSubmit={handleSubmit}
					/>
				)}
				{(step === "answer" || step === "rated") && (
					<ExerciseResult
						word={current.word}
						userAnswer={userAnswer}
						mode={current.assignedMode}
					/>
				)}
			</Card>

			{step === "answer" && (
				<div className="flex gap-2 w-full">
					{([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const).map(
						(rating) => {
							const colors = getRatingColors(rating);
							return (
								<button
									key={rating}
									type="button"
									onClick={() => handleRate(rating)}
									disabled={isReviewing}
									className={`flex-1 py-3 px-2 rounded-xl font-medium text-sm transition-all active:scale-95 disabled:opacity-50 ${colors.bg} ${colors.hover} ${colors.text} ring-1 ${colors.ring}`}
								>
									<div className="text-xs opacity-70">
										[{getRatingKey(rating)}]
									</div>
									<div>{getRatingLabel(rating)}</div>
								</button>
							);
						},
					)}
				</div>
			)}
		</div>
	);
}

// ─── Correctness check ──────────────────────────────────

function checkAnswer(
	word: WordWithReview,
	answer: string,
	mode: InteractiveMode,
): boolean {
	if (mode === "hanzi-choice") return answer === word.hanzi;
	return pinyinMatch(answer, word.pinyin);
}

// ─── Session Accuracy ───────────────────────────────────

function SessionAccuracy({ stats }: { stats: SessionStat[] }) {
	const total = stats.filter((s) => s.rating !== Rating.Again).length;
	const correct = stats.filter((s) => s.correct).length;
	if (total === 0) return null;
	const pct = Math.round((correct / Math.max(total, 1)) * 100);
	const color =
		pct >= 80
			? "text-green-500"
			: pct >= 50
				? "text-yellow-500"
				: "text-red-500";
	return <span className={`text-xs font-medium ${color}`}>{pct}%</span>;
}

// ─── Exercise Prompt ────────────────────────────────────

function ExercisePrompt({
	mode,
	word,
	distractors,
	onSubmit,
}: {
	mode: InteractiveMode;
	word: WordWithReview;
	distractors: string[];
	onSubmit: (answer: string) => void;
}) {
	const [input, setInput] = useState("");
	const [selected, setSelected] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (mode === "pinyin-input" || mode === "listen-input") {
			inputRef.current?.focus();
		}
	}, [mode]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && input.trim()) {
			onSubmit(input.trim());
		}
	};

	switch (mode) {
		case "pinyin-input":
			return (
				<>
					<p className="text-xs text-muted-foreground uppercase tracking-wider">
						Nhìn chữ Hán → Gõ pinyin
					</p>
					<p className="text-7xl md:text-8xl font-kai leading-tight select-none">
						{word.hanzi}
					</p>
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(applyPinyinIME(e.target.value))}
						onKeyDown={handleKeyDown}
						placeholder='Gõ pinyin (vd: "ni hao" hoặc "nǐ hǎo")'
						className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
						autoComplete="off"
						autoCorrect="off"
						spellCheck={false}
					/>
					<Button
						size="lg"
						className="w-full"
						disabled={!input.trim()}
						onClick={() => onSubmit(input.trim())}
					>
						Kiểm tra
					</Button>
				</>
			);

		case "hanzi-choice":
			return (
				<>
					<p className="text-xs text-muted-foreground uppercase tracking-wider">
						Xem gợi ý → Chọn chữ Hán đúng
					</p>
					<div className="text-center space-y-1">
						<p className="text-lg text-muted-foreground">{word.pinyin}</p>
						<p className="text-2xl font-medium">{word.meaning}</p>
					</div>
					<div className="grid grid-cols-2 gap-3 w-full">
						{[...distractors, word.hanzi]
							.sort(() => Math.random() - 0.5)
							.map((hanzi) => (
								<button
									key={hanzi}
									type="button"
									onClick={() => {
										setSelected(hanzi);
										onSubmit(hanzi);
									}}
									className={`py-4 px-3 rounded-xl border-2 text-3xl font-kai transition-all ${
										selected === hanzi
											? "border-primary bg-primary/5"
											: "border-border hover:border-primary/40 hover:bg-muted/30"
									}`}
								>
									{hanzi}
								</button>
							))}
					</div>
				</>
			);

		case "listen-input":
			return (
				<ListenInput
					word={word}
					inputRef={inputRef}
					input={input}
					setInput={setInput}
					onSubmit={onSubmit}
					handleKeyDown={handleKeyDown}
				/>
			);

		default:
			return null;
	}
}

// ─── Listen Input ───────────────────────────────────────

function ListenInput({
	word,
	inputRef,
	input,
	setInput,
	onSubmit,
	handleKeyDown,
}: {
	word: WordWithReview;
	inputRef: React.RefObject<HTMLInputElement | null>;
	input: string;
	setInput: (v: string) => void;
	onSubmit: (answer: string) => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
}) {
	const [playing, setPlaying] = useState(false);

	const speak = useCallback(() => {
		if (!("speechSynthesis" in window)) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(word.hanzi);
		utterance.lang = "zh-CN";
		utterance.rate = 0.8;
		setPlaying(true);
		utterance.onend = () => setPlaying(false);
		utterance.onerror = () => setPlaying(false);
		window.speechSynthesis.speak(utterance);
	}, [word.hanzi]);

	useEffect(() => {
		const t = setTimeout(() => speak(), 300);
		return () => {
			clearTimeout(t);
			window.speechSynthesis.cancel();
		};
	}, [speak]);

	return (
		<>
			<p className="text-xs text-muted-foreground uppercase tracking-wider">
				Nghe phát âm → Gõ pinyin
			</p>
			<button
				type="button"
				onClick={speak}
				disabled={playing}
				className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50"
			>
				<Speaker
					size={32}
					className={`text-primary ${playing ? "animate-pulse" : ""}`}
				/>
			</button>
			<p className="text-sm text-muted-foreground">
				{playing ? "Đang phát..." : "Nhấn loa để nghe lại"}
			</p>
			<input
				ref={inputRef}
				type="text"
				value={input}
				onChange={(e) => setInput(applyPinyinIME(e.target.value))}
				onKeyDown={handleKeyDown}
				placeholder='Gõ pinyin (vd: "ni hao")'
				className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
				autoComplete="off"
				autoCorrect="off"
				spellCheck={false}
			/>
			<Button
				size="lg"
				className="w-full"
				disabled={!input.trim()}
				onClick={() => onSubmit(input.trim())}
			>
				Kiểm tra
			</Button>
		</>
	);
}

// ─── Exercise Result ────────────────────────────────────

function ExerciseResult({
	word,
	userAnswer,
	mode,
}: {
	word: WordWithReview;
	userAnswer: string;
	mode: InteractiveMode;
}) {
	const correctAnswer =
		mode === "pinyin-input" || mode === "listen-input"
			? word.pinyin
			: word.hanzi;

	const isCorrect =
		mode === "hanzi-choice"
			? userAnswer === word.hanzi
			: pinyinMatch(userAnswer, word.pinyin);

	const card = word.word_review ? dbToCard(word.word_review) : null;

	const masteryLevel = card ? getMasteryLevel(card) : "unstudied";
	const masteryInfo = getMasteryInfo(masteryLevel);

	return (
		<>
			<div className="text-center space-y-2 w-full">
				{isCorrect ? (
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
						<span>Chính xác</span>
					</div>
				) : (
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-sm font-medium">
						<span>Chưa đúng</span>
					</div>
				)}

				<div className="space-y-1">
					<p className="text-5xl md:text-6xl font-kai leading-tight select-none">
						{word.hanzi}
					</p>
					<p className="text-lg text-muted-foreground">{word.pinyin}</p>
					<p className="text-base font-medium">{word.meaning}</p>
				</div>

				{!isCorrect && (
					<div className="text-sm space-y-0.5">
						<p className="text-muted-foreground">
							Bạn đã nhập:{" "}
							<span className="text-red-500 font-medium">{userAnswer}</span>
						</p>
						<p className="text-muted-foreground">
							Đáp án:{" "}
							<span className="text-green-500 font-medium">
								{correctAnswer}
							</span>
						</p>
					</div>
				)}

				<div className="flex items-center justify-center gap-2 pt-1">
					<Badge variant={masteryInfo.variant}>{masteryInfo.label}</Badge>
					{word.word_review && (
						<span className="text-xs text-muted-foreground">
							Lần ôn thứ {(word.word_review.total_reviews ?? 0) + 1}
						</span>
					)}
				</div>
			</div>

			<div className="text-xs text-muted-foreground text-center">
				Đánh giá mức độ nhớ của bạn:
			</div>
		</>
	);
}
