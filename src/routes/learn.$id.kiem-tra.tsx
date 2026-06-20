import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudySet } from "@/hooks/queries/useVocabulary";

export const Route = createFileRoute("/learn/$id/kiem-tra")({
	component: TestPage,
});

type QuestionType = "hanzi-to-meaning" | "meaning-to-hanzi";

function TestPage() {
	const { id } = Route.useParams();
	const numericId = Number(id);
	const navigate = useNavigate();

	const { data: set, isLoading } = useStudySet(numericId);
	const [index, setIndex] = useState(0);
	const [score, setScore] = useState(0);
	const [answered, setAnswered] = useState<boolean | null>(null);
	const [done, setDone] = useState(false);
	const [qType, setQType] = useState<QuestionType>("hanzi-to-meaning");
	const [shuffledWords, setShuffledWords] = useState<typeof set.words>([]);

	useEffect(() => {
		document.title = "Kiểm tra - Minihanzi";
	}, []);

	useEffect(() => {
		if (!set) return;
		const w = [...set.words].sort(() => Math.random() - 0.5);
		setShuffledWords(w);
	}, [set]);

	const current = shuffledWords[index];

	const options = useMemo(() => {
		if (!current || !set) return [];
		const pool = set.words.filter((w) => w.hanzi !== current.hanzi);
		const wrong = pool.sort(() => Math.random() - 0.5).slice(0, 3);
		const all =
			qType === "hanzi-to-meaning"
				? [
						{ label: current.vietnamese, correct: true },
						...wrong.map((w) => ({ label: w.vietnamese, correct: false })),
					]
				: [
						{ label: current.hanzi, correct: true },
						...wrong.map((w) => ({ label: w.hanzi, correct: false })),
					];
		return all.sort(() => Math.random() - 0.5);
	}, [current, set, qType]);

	const handleAnswer = useCallback(
		(correct: boolean) => {
			if (answered !== null) return;
			setAnswered(correct);
			if (correct) setScore((s) => s + 1);
		},
		[answered],
	);

	function next() {
		if (index < shuffledWords.length - 1) {
			setIndex((i) => i + 1);
			setAnswered(null);
		} else {
			setDone(true);
		}
	}

	function reset() {
		const w = set ? [...set.words].sort(() => Math.random() - 0.5) : [];
		setShuffledWords(w);
		setIndex(0);
		setScore(0);
		setAnswered(null);
		setDone(false);
	}

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-48 w-full rounded-xl" />
			</div>
		);
	}

	if (!set || !current) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Button variant="ghost" onClick={() => navigate({ to: "/learn" })}>
					<ArrowLeft size={16} className="mr-1" /> Quay lại
				</Button>
				<p className="mt-8 text-center text-muted-foreground">
					Bộ từ không tìm thấy
				</p>
			</div>
		);
	}

	if (done) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
					<div className="text-6xl mb-4 opacity-20">📝</div>
					<h2 className="text-xl font-bold mb-2">Hoàn thành!</h2>
					<p className="text-3xl font-bold text-primary mb-2">
						{score}/{shuffledWords.length}
					</p>
					<p className="text-sm text-muted-foreground mb-6">
						{score === shuffledWords.length
							? "Hoàn hảo!"
							: score >= shuffledWords.length * 0.7
								? "Khá tốt!"
								: "Cố gắng thêm nhé!"}
					</p>
					<div className="flex gap-3">
						<Button variant="outline" onClick={reset}>
							<RotateCw size={14} className="mr-1" /> Làm lại
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate({ to: "/learn/$id", params: { id } })}
						>
							Quay lại
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl p-4 md:p-6">
			<div className="flex items-center justify-between mb-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate({ to: "/learn/$id", params: { id } })}
				>
					<ArrowLeft size={16} className="mr-1" /> {set.title}
				</Button>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-xs">
						{score}/{index + (answered !== null ? 1 : 0)}
					</Badge>
					<Badge variant="outline" className="text-xs">
						{index + 1}/{shuffledWords.length}
					</Badge>
				</div>
			</div>

			<div className="flex justify-center gap-2 mb-4">
				<Button
					variant={qType === "hanzi-to-meaning" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						setQType("hanzi-to-meaning");
						reset();
					}}
				>
					汉字 → Nghĩa
				</Button>
				<Button
					variant={qType === "meaning-to-hanzi" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						setQType("meaning-to-hanzi");
						reset();
					}}
				>
					Nghĩa → 汉字
				</Button>
			</div>

			<Card className="mb-6">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<span className="text-5xl md:text-6xl font-serif tracking-wider mb-3">
						{qType === "hanzi-to-meaning" ? current.hanzi : current.vietnamese}
					</span>
					{qType === "hanzi-to-meaning" && (
						<span className="text-sm text-muted-foreground">
							{current.pinyin}
						</span>
					)}
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{options.map((opt, i) => (
					<button
						key={i}
						type="button"
						onClick={() => handleAnswer(opt.correct)}
						className={`rounded-lg border-2 p-4 text-center text-base font-medium transition-colors hover:bg-accent/50 ${
							answered === null
								? "border-border hover:border-primary/30"
								: opt.correct
									? "border-green-500 bg-green-50 dark:bg-green-950/30"
									: answered === false && !opt.correct
										? "border-red-300 bg-red-50 dark:bg-red-950/30"
										: "border-border opacity-60"
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			{answered !== null && (
				<div className="flex justify-center mt-6">
					<Button onClick={next}>
						{index === shuffledWords.length - 1 ? "Xem kết quả" : "Tiếp"}
					</Button>
				</div>
			)}
		</div>
	);
}
