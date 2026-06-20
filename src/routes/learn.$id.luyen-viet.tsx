import { createFileRoute, useNavigate } from "@tanstack/react-router";
import HanziWriter from "hanzi-writer";
import { ArrowLeft, RotateCw, Volume2 } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudySet } from "@/hooks/queries/useVocabulary";
import type { VocabWord } from "@/lib/supabase/vocabulary";

export const Route = createFileRoute("/learn/$id/luyen-viet")({
	component: WritingPage,
});

function WritingPage() {
	const { id } = Route.useParams();
	const numericId = Number(id);
	const navigate = useNavigate();

	const { data: set, isLoading } = useStudySet(numericId);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		document.title = "Luyện viết - Minihanzi";
	}, []);

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-80 w-full rounded-xl" />
			</div>
		);
	}

	if (!set) {
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

	const words = set.words;
	const word = words[index];

	if (!word) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Button variant="ghost" onClick={() => navigate({ to: "/learn" })}>
					<ArrowLeft size={16} className="mr-1" /> Quay lại
				</Button>
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
					{index + 1}/{words.length}
				</Badge>
			</div>

			<Card className="p-4">
				<HanziWriterCanvas
					word={word}
					words={words}
					index={index}
					setIndex={setIndex}
				/>
			</Card>
		</div>
	);
}

const HanziWriterCanvas = memo(function HanziWriterCanvas({
	word,
	words,
	index,
	setIndex,
}: {
	word: VocabWord;
	words: VocabWord[];
	index: number;
	setIndex: (i: number) => void;
}) {
	const canvasRef = useRef<HTMLDivElement>(null);
	const writerRef = useRef<HanziWriter | null>(null);

	const chars = [...word.hanzi];
	const [charIdx, setCharIdx] = useState(0);
	const currentChar = chars[charIdx] || word.hanzi;

	useEffect(() => {
		setCharIdx(0);
	}, []);

	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		el.innerHTML = "";

		const writer = HanziWriter.create(el, currentChar, {
			width: 280,
			height: 280,
			padding: 10,
			strokeColor: "#1a1a2e",
			radicalColor: "#c0392b",
			showOutline: true,
			delayBetweenStrokes: 600,
		});
		writerRef.current = writer;

		return () => {
			writerRef.current = null;
		};
	}, [currentChar]);

	function replay() {
		writerRef.current?.loopCharacterAnimation();
	}

	function playAudio(text: string) {
		const u = new SpeechSynthesisUtterance(text);
		u.lang = "zh-CN";
		speechSynthesis.cancel();
		speechSynthesis.speak(u);
	}

	function goNextWord() {
		if (index < words.length - 1) {
			setIndex(index + 1);
		}
	}

	function goPrevWord() {
		if (index > 0) {
			setIndex(index - 1);
		}
	}

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="text-center">
				<span className="text-3xl font-serif tracking-wider">{word.hanzi}</span>
				<span className="ml-2 text-sm text-muted-foreground">
					{word.pinyin}
				</span>
				<span className="ml-2 text-sm text-muted-foreground">
					{word.vietnamese}
				</span>
			</div>

			{chars.length > 1 && (
				<div className="flex gap-1">
					{chars.map((ch, i) => (
						<button
							key={i}
							type="button"
							onClick={() => setCharIdx(i)}
							className={`px-2 py-1 rounded text-sm font-serif border transition-colors ${
								i === charIdx
									? "border-primary bg-primary/10 text-primary"
									: "border-border text-muted-foreground hover:bg-accent"
							}`}
						>
							{ch}
						</button>
					))}
				</div>
			)}

			<div ref={canvasRef} className="rounded-lg border bg-white" />

			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" onClick={replay}>
					<RotateCw size={14} className="mr-1" /> Xem lại nét
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => playAudio(word.hanzi)}
				>
					<Volume2 size={14} className="mr-1" /> Nghe
				</Button>
			</div>

			<div className="flex items-center gap-3">
				<Button variant="outline" onClick={goPrevWord} disabled={index === 0}>
					← Trước
				</Button>
				<Button
					variant="outline"
					onClick={goNextWord}
					disabled={index === words.length - 1}
				>
					Sau →
				</Button>
			</div>
		</div>
	);
});
