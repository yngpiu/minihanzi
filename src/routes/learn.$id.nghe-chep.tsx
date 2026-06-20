import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, RotateCw, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudySet } from "@/hooks/queries/useVocabulary";

export const Route = createFileRoute("/learn/$id/nghe-chep")({
	component: DictationPage,
});

type DictMode = "hanzi" | "pinyin";

function DictationPage() {
	const { id } = Route.useParams();
	const numericId = Number(id);
	const navigate = useNavigate();

	const { data: set, isLoading } = useStudySet(numericId);
	const [index, setIndex] = useState(0);
	const [value, setValue] = useState("");
	const [result, setResult] = useState<boolean | null>(null);
	const [mode, setMode] = useState<DictMode>("hanzi");
	const [shuffled, setShuffled] = useState<typeof set.words>([]);

	useEffect(() => {
		document.title = "Nghe chép - Minihanzi";
	}, []);

	useEffect(() => {
		if (!set) return;
		const w = [...set.words].sort(() => Math.random() - 0.5);
		setShuffled(w);
	}, [set]);

	const current = shuffled[index];

	const playAudio = useCallback(
		(word: typeof current) => {
			if (!word) return;
			const text = mode === "hanzi" ? word.hanzi : word.pinyin;
			const u = new SpeechSynthesisUtterance(text);
			u.lang = "zh-CN";
			u.rate = mode === "hanzi" ? 0.7 : 0.9;
			speechSynthesis.cancel();
			speechSynthesis.speak(u);
		},
		[mode],
	);

	useEffect(() => {
		if (!current) return;
		const t = setTimeout(() => playAudio(current), 300);
		return () => clearTimeout(t);
	}, [current, playAudio]);

	const checkAnswer = useCallback(() => {
		if (!current) return;
		const answer = value.trim().toLowerCase();
		const target = current.hanzi.trim().toLowerCase();
		const correct = answer === target;
		setResult(correct);
	}, [current, value]);

	function next() {
		if (index < shuffled.length - 1) {
			setIndex((i) => i + 1);
			setValue("");
			setResult(null);
		}
	}

	function replay() {
		if (current) playAudio(current);
	}

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-64 w-full rounded-xl" />
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
				<Badge variant="outline" className="text-xs">
					{index + 1}/{shuffled.length}
				</Badge>
			</div>

			<div className="flex justify-center gap-2 mb-4">
				<Button
					variant={mode === "hanzi" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						setMode("hanzi");
						setResult(null);
						setValue("");
					}}
				>
					Nghe chữ
				</Button>
				<Button
					variant={mode === "pinyin" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						setMode("pinyin");
						setResult(null);
						setValue("");
					}}
				>
					Nghe pinyin
				</Button>
			</div>

			<Card className="flex flex-col items-center justify-center py-12 mb-6">
				<button
					type="button"
					onClick={replay}
					className="flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
				>
					<Volume2 size={48} className="text-primary" />
					<span className="text-sm">Nhấn để nghe lại</span>
				</button>
			</Card>

			<div className="flex gap-2 mb-4">
				<Input
					value={value}
					onChange={(e) => {
						setValue(e.target.value);
						setResult(null);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" && result === null) {
							checkAnswer();
						} else if (e.key === "Enter" && result !== null) {
							next();
						}
					}}
					placeholder={
						mode === "hanzi"
							? "Gõ chữ Hán bạn nghe được…"
							: "Gõ pinyin bạn nghe được…"
					}
					className="h-11 text-base"
					autoFocus
				/>
				{result === null && (
					<Button onClick={checkAnswer} className="h-11 shrink-0">
						Kiểm tra
					</Button>
				)}
				{result !== null && (
					<Button onClick={next} className="h-11 shrink-0">
						Tiếp
					</Button>
				)}
			</div>

			{result !== null && (
				<div
					className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
						result
							? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
							: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
					}`}
				>
					{result ? <Check size={16} /> : <X size={16} />}
					<span>
						{result
							? "Chính xác!"
							: `Đáp án đúng: ${current.hanzi} (${current.pinyin}) — ${current.vietnamese}`}
					</span>
				</div>
			)}

			{index === shuffled.length - 1 && result !== null && (
				<div className="flex justify-center mt-6">
					<Button
						variant="outline"
						onClick={() => {
							const w = set
								? [...set.words].sort(() => Math.random() - 0.5)
								: [];
							setShuffled(w);
							setIndex(0);
							setValue("");
							setResult(null);
						}}
					>
						<RotateCw size={14} className="mr-1" /> Làm lại
					</Button>
				</div>
			)}
		</div>
	);
}
