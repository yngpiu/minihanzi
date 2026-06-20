import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCw, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card as FSRSCard } from "ts-fsrs";
import { createEmptyCard, FSRS, Rating } from "ts-fsrs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudySet } from "@/hooks/queries/useVocabulary";
import { getSRSCards, saveAllSRSCards, saveSRSCard } from "@/lib/supabase/srs";

export const Route = createFileRoute("/learn/$id/srs")({
	component: SRSPage,
});

const f = new FSRS();

interface LocalCard extends FSRSCard {
	hanzi: string;
	pinyin: string;
	vietnamese: string;
	example: string;
}

async function loadCardsFromDB(
	setId: number,
	words: Array<{
		hanzi: string;
		pinyin: string;
		vietnamese: string;
		example: string;
	}>,
): Promise<LocalCard[]> {
	const existing = await getSRSCards(setId);
	if (existing.size > 0) {
		return words.map((w) => {
			const card = existing.get(w.hanzi);
			return {
				...(card ?? createEmptyCard(new Date())),
				hanzi: w.hanzi,
				pinyin: w.pinyin,
				vietnamese: w.vietnamese,
				example: w.example,
			};
		});
	}

	const initial = words.map((w) => {
		const card = createEmptyCard(new Date());
		return {
			...card,
			hanzi: w.hanzi,
			pinyin: w.pinyin,
			vietnamese: w.vietnamese,
			example: w.example,
		};
	});

	await saveAllSRSCards(
		setId,
		initial.map((c) => ({ hanzi: c.hanzi, card: c })),
	);

	return initial;
}

function SRSPage() {
	const { id } = Route.useParams();
	const numericId = Number(id);
	const navigate = useNavigate();

	const { data: set } = useStudySet(numericId);
	const [cards, setCards] = useState<LocalCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [done, setDone] = useState(false);

	useEffect(() => {
		document.title = "SRS - Minihanzi";
	}, []);

	useEffect(() => {
		if (!set) return;
		let cancelled = false;
		loadCardsFromDB(
			numericId,
			set.words.map((w) => ({
				hanzi: w.hanzi,
				pinyin: w.pinyin,
				vietnamese: w.vietnamese,
				example: w.example,
			})),
		).then((loaded) => {
			if (!cancelled) {
				setCards(loaded);
				setLoading(false);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [numericId, set]);

	const dueCards = useMemo(
		() => cards.filter((c) => c.due.getTime?.() <= Date.now()),
		[cards],
	);

	const current = dueCards[index];
	const currentRef = useRef(current);
	currentRef.current = current;
	const dueLenRef = useRef(dueCards.length);
	dueLenRef.current = dueCards.length;

	const handleGrade = useCallback(
		async (rating: Rating) => {
			const card = currentRef.current;
			if (!card) return;
			const now = new Date();
			const recordLog = f.repeat(card, now);
			const { card: updatedCard } = recordLog[rating];
			speechSynthesis.cancel();

			setCards((prev) =>
				prev.map((c) =>
					c.hanzi !== card.hanzi
						? c
						: {
								...c,
								...updatedCard,
								hanzi: c.hanzi,
								pinyin: c.pinyin,
								vietnamese: c.vietnamese,
								example: c.example,
							},
				),
			);

			setIndex((i) => {
				if (i >= dueLenRef.current - 1) {
					setDone(true);
					return i;
				}
				setFlipped(false);
				return i + 1;
			});

			saveSRSCard(numericId, card.hanzi, updatedCard);
		},
		[numericId],
	);

	function playAudio(text: string) {
		const u = new SpeechSynthesisUtterance(text);
		u.lang = "zh-CN";
		speechSynthesis.cancel();
		speechSynthesis.speak(u);
	}

	function reset() {
		setFlipped(false);
		setIndex(0);
		setDone(false);
	}

	async function resetAll() {
		if (!set) return;
		const fresh = set.words.map((w) => {
			const card = createEmptyCard(new Date());
			return {
				...card,
				hanzi: w.hanzi,
				pinyin: w.pinyin,
				vietnamese: w.vietnamese,
				example: w.example,
			};
		});
		await saveAllSRSCards(
			numericId,
			fresh.map((c) => ({ hanzi: c.hanzi, card: c })),
		);
		setCards(fresh);
		setIndex(0);
		setFlipped(false);
		setDone(false);
	}

	if (loading) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Skeleton className="h-96 w-full rounded-xl" />
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

	if (dueCards.length === 0 || done) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate({ to: "/learn/$id", params: { id } })}
				>
					<ArrowLeft size={16} className="mr-1" /> {set.title}
				</Button>
				<div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
					<div className="text-6xl mb-4 opacity-20">&#127881;</div>
					<h2 className="text-xl font-bold mb-2">
						{done ? "Đã ôn tập xong!" : "Không có từ cần ôn"}
					</h2>
					<p className="text-sm text-muted-foreground mb-6">
						{done
							? `Đã ôn ${dueCards.length} từ. Hẹn gặp lại!`
							: "Tất cả từ đã được lên lịch. Quay lại sau!"}
					</p>
					<div className="flex gap-3">
						<Button variant="outline" onClick={reset}>
							<RotateCw size={14} className="mr-1" /> Làm lại
						</Button>
						<Button variant="outline" onClick={resetAll}>
							Đặt lại tất cả
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
				<Badge variant="outline" className="text-xs">
					Còn {dueCards.length - index} từ
				</Badge>
			</div>

			<button
				type="button"
				onClick={() => setFlipped(!flipped)}
				className="w-full min-h-[300px] rounded-xl border-2 border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
			>
				<div className="flex flex-col items-center justify-center min-h-[300px] p-8">
					{!flipped ? (
						<>
							<span className="text-6xl md:text-7xl font-serif tracking-wider mb-4">
								{current.hanzi}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									playAudio(current.hanzi);
								}}
								className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
							>
								<Volume2 size={14} /> Nghe
							</button>
							<div className="mt-4 text-xs text-muted-foreground/60">
								Nhấn để xem đáp án
							</div>
						</>
					) : (
						<div className="space-y-4 text-center">
							<span className="text-4xl md:text-5xl font-serif tracking-wider block">
								{current.hanzi}
							</span>
							<div className="text-lg text-muted-foreground">
								{current.pinyin}
							</div>
							<div className="text-xl font-medium">{current.vietnamese}</div>
							{current.example && (
								<div className="text-sm text-muted-foreground/80 italic max-w-md mx-auto">
									{current.example}
								</div>
							)}
						</div>
					)}
				</div>
			</button>

			{flipped && (
				<div className="flex items-center justify-center gap-2 mt-4">
					<Button
						variant="outline"
						className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
						onClick={() => handleGrade(Rating.Again)}
					>
						Again
					</Button>
					<Button
						variant="outline"
						className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-950"
						onClick={() => handleGrade(Rating.Hard)}
					>
						Hard
					</Button>
					<Button
						variant="outline"
						className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950"
						onClick={() => handleGrade(Rating.Good)}
					>
						Good
					</Button>
					<Button
						variant="outline"
						className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950"
						onClick={() => handleGrade(Rating.Easy)}
					>
						Easy
					</Button>
				</div>
			)}
		</div>
	);
}
