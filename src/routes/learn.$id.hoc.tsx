import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	RotateCw,
	Shuffle,
	Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudySet } from "@/hooks/queries/useVocabulary";
import type { VocabWord } from "@/lib/supabase/vocabulary";

export const Route = createFileRoute("/learn/$id/hoc")({
	component: FlashcardPage,
});

function FlashcardPage() {
	const { id } = Route.useParams();
	const numericId = Number(id);
	const navigate = useNavigate();

	const { data: set, isLoading } = useStudySet(numericId);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [shuffled, setShuffled] = useState(false);

	useEffect(() => {
		document.title = "Học - Minihanzi";
	}, []);

	const words = useMemo(() => {
		if (!set) return [];
		const w = [...set.words];
		if (shuffled) {
			for (let i = w.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[w[i], w[j]] = [w[j], w[i]];
			}
		}
		return w;
	}, [set, shuffled]);

	const word = words[index] as VocabWord | undefined;

	const goNext = useCallback(() => {
		if (index < words.length - 1) {
			setIndex((i) => i + 1);
			setFlipped(false);
		}
	}, [index, words.length]);

	const goPrev = useCallback(() => {
		if (index > 0) {
			setIndex((i) => i - 1);
			setFlipped(false);
		}
	}, [index]);

	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "ArrowRight" || e.key === " ") {
				e.preventDefault();
				if (!flipped) setFlipped(true);
				else goNext();
			} else if (e.key === "ArrowLeft") {
				goPrev();
			}
		}
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [flipped, goNext, goPrev]);

	function playAudio(text: string) {
		const u = new SpeechSynthesisUtterance(text);
		u.lang = "zh-CN";
		u.rate = 0.9;
		speechSynthesis.cancel();
		speechSynthesis.speak(u);
	}

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	if (!set || !word) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Button variant="ghost" onClick={() => navigate({ to: "/learn" })}>
					<ArrowLeft size={16} className="mr-1" /> Quay lại
				</Button>
				<p className="mt-8 text-center text-muted-foreground">
					Bộ từ rỗng hoặc không tìm thấy
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
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setShuffled((s) => !s);
						setIndex(0);
						setFlipped(false);
					}}
					className={shuffled ? "bg-accent" : ""}
				>
					<Shuffle size={14} className="mr-1" /> Xáo trộn
				</Button>
			</div>

			<div className="text-center text-sm text-muted-foreground mb-4">
				{index + 1} / {words.length}
			</div>

			{/* biome-ignore lint/a11y/useSemanticElements: div role=button avoids nested <button> which is invalid HTML */}
			<div
				role="button"
				tabIndex={0}
				onClick={() => setFlipped(!flipped)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setFlipped(!flipped);
					}
				}}
				className="w-full min-h-[320px] rounded-xl border-2 border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
			>
				<div className="flex flex-col items-center justify-center min-h-[320px] p-8">
					{!flipped ? (
						<>
							<span className="text-6xl md:text-7xl font-serif tracking-wider mb-4">
								{word.hanzi}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									playAudio(word.hanzi);
								}}
								className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
							>
								<Volume2 size={14} /> Nghe
							</button>
							<div className="mt-4 text-xs text-muted-foreground/60">
								Nhấn để lật thẻ
							</div>
						</>
					) : (
						<div className="space-y-4 text-center">
							<span className="text-4xl md:text-5xl font-serif tracking-wider block">
								{word.hanzi}
							</span>
							<div className="text-lg text-muted-foreground">{word.pinyin}</div>
							<div className="text-xl font-medium">{word.vietnamese}</div>
							{word.example && (
								<div className="text-sm text-muted-foreground/80 italic max-w-md mx-auto">
									{word.example}
								</div>
							)}
							<div className="text-xs text-muted-foreground/60">
								Nhấn để lật lại
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
				<Button
					variant="outline"
					size="sm"
					onClick={goPrev}
					disabled={index === 0}
				>
					<ArrowLeft size={16} className="mr-1" /> Trước
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setFlipped(false);
						setIndex(0);
					}}
				>
					<RotateCw size={14} />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={goNext}
					disabled={index === words.length - 1}
				>
					Sau <ArrowRight size={16} className="ml-1" />
				</Button>
			</div>
		</div>
	);
}
