import HZ from "hanzi-writer";
import { RotateCw } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
	char: string;
	width?: number;
	height?: number;
	autoPlay?: boolean;
	strokeAnimationSpeed?: number;
}

export function HanziWriterDisplay({
	char,
	width = 120,
	height = 120,
	autoPlay = true,
	strokeAnimationSpeed = 1,
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const writerRef = useRef<HZ | null>(null);
	const single = [...char][0] || "";

	useEffect(() => {
		const el = containerRef.current;
		if (!el || !single) return;

		el.innerHTML = "";

		const writer = HZ.create(el, single, {
			width,
			height,
			padding: 5,
			strokeColor: "#555",
			outlineColor: "#d4d4d8",
			radicalColor: "#a855f7",
			strokeAnimationSpeed,
			delayBetweenStrokes: 500,
			showCharacter: true,
			showOutline: true,
		});
		writerRef.current = writer;

		if (autoPlay) {
			setTimeout(() => writer.loopCharacterAnimation(), 300);
		}

		return () => {
			writer.pauseAnimation();
			writerRef.current = null;
		};
	}, [single, width, height, autoPlay, strokeAnimationSpeed]);

	function handleReplay() {
		writerRef.current?.loopCharacterAnimation();
	}

	return (
		<div className="flex flex-col items-center gap-1">
			<div ref={containerRef} style={{ width, height }} />
			{char.length > 1 && (
				<p className="text-[10px] text-muted-foreground">
					(nét chữ "{single}" — từ có {char.length} chữ)
				</p>
			)}
			<button
				type="button"
				onClick={handleReplay}
				className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
			>
				<RotateCw size={11} />
				Xem lại nét
			</button>
		</div>
	);
}
