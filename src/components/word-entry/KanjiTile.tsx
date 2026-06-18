import { Pause, PenLine, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { KanjiResult } from "@/services/types";

export function KanjiTile({
	char,
	detail,
	loading,
}: {
	char: string;
	detail?: KanjiResult;
	loading?: boolean;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const hw = useRef<{
		pauseAnimation: () => void;
		resumeAnimation: () => void;
		animateCharacter: (opts: { onComplete: () => void }) => void;
		cancelQuiz: () => void;
		quiz: (opts: { onComplete: () => void }) => void;
	} | null>(null);
	const [anim, setAnim] = useState<"idle" | "on" | "pause">("idle");
	const [quiz, setQuiz] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function init() {
			const mod: {
				default?: { create: (...args: never[]) => unknown };
				create?: (...args: never[]) => unknown;
			} = await import("hanzi-writer");
			const Writer = mod.default || mod;
			if (!ref.current || cancelled) return;
			ref.current.innerHTML = "";
			const isDark =
				typeof document !== "undefined" &&
				document.documentElement.classList.contains("dark");
			const strokeColor = isDark ? "#58a6ff" : "#2563eb";
			const radicalColor = isDark ? "#a78bfa" : "#7c3aed";
			const outlineColor = isDark ? "#30363d" : "#e5e7eb";

			const w = Writer.create(ref.current, char, {
				width: 140,
				height: 140,
				padding: 10,
				strokeColor,
				radicalColor,
				outlineColor,
				strokeAnimationSpeed: 1.5,
				delayBetweenStrokes: 500,
				showOutline: true,
				showCharacter: true,
				charDataLoader: (
					c: string,
					onComplete: (data: unknown) => void,
					onFailure: () => void,
				) => {
					fetch(
						`https://gcore.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`,
					)
						.then((res) => {
							if (!res.ok) throw new Error();
							return res.json();
						})
						.then(onComplete)
						.catch(() => {
							fetch(
								`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`,
							)
								.then((res) => res.json())
								.then(onComplete)
								.catch(onFailure);
						});
				},
			});
			hw.current = w;
		}
		init();
		return () => {
			cancelled = true;
		};
	}, [char]);

	function toggleAnim() {
		const w = hw.current;
		if (!w) return;
		if (anim === "on") {
			w.pauseAnimation();
			setAnim("pause");
		} else if (anim === "pause") {
			w.resumeAnimation();
			setAnim("on");
		} else {
			setAnim("on");
			w.animateCharacter({ onComplete: () => setAnim("idle") });
		}
	}

	function toggleQuiz() {
		if (quiz) {
			hw.current?.cancelQuiz();
			setQuiz(false);
		} else {
			setQuiz(true);
			hw.current?.quiz({ onComplete: () => setQuiz(false) });
		}
	}

	return (
		<div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card">
			<div ref={ref} style={{ width: 140, height: 140 }} />
			<span className="text-lg font-medium">{char}</span>
			{loading ? (
				<div className="text-xs text-muted-foreground">Đang tải…</div>
			) : detail ? (
				<div className="w-full space-y-1 text-xs">
					{detail.pinyin && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Pinyin</span>
							<span>{detail.pinyin}</span>
						</div>
					)}
					{detail.sets && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Bộ</span>
							<span>{detail.sets}</span>
						</div>
					)}
					{detail.count !== undefined && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Số nét</span>
							<span>{detail.count}</span>
						</div>
					)}
					{detail.lucthu && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Lục thư</span>
							<span>{detail.lucthu}</span>
						</div>
					)}
				</div>
			) : (
				<div className="text-xs text-muted-foreground">Không có chi tiết</div>
			)}
			<div className="flex gap-1.5">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={toggleAnim}
					title="Phát nét"
				>
					{anim === "on" ? <Pause size={14} /> : <Play size={14} />}
				</Button>
				<Button
					variant={quiz ? "default" : "ghost"}
					size="icon-sm"
					onClick={toggleQuiz}
					title="Luyện viết"
				>
					<PenLine size={14} />
				</Button>
			</div>
		</div>
	);
}
