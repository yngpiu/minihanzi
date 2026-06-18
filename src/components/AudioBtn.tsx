import { Square, Volume2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { getAudioUrl } from "@/services/utils";

interface Props {
	id?: number | string;
	audioType?: string;
	containerId?: string;
	small?: boolean;
}

export function AudioBtn({
	id,
	audioType = "cnvi",
	containerId,
	small,
}: Props) {
	const [playing, setPlaying] = useState(false);
	const raf = useRef(0);
	const au = useRef<HTMLAudioElement | null>(null);

	const stopKaraoke = useCallback(() => {
		cancelAnimationFrame(raf.current);
		if (containerId) {
			document
				.querySelectorAll(`#${CSS.escape(containerId)} .kc`)
				.forEach((el) => {
					el.classList.remove("kc");
				});
		}
	}, [containerId]);

	function play(e: React.MouseEvent) {
		e.stopPropagation();
		if (!id) return;
		if (playing) {
			au.current?.pause();
			setPlaying(false);
			stopKaraoke();
			return;
		}

		const a = new Audio(getAudioUrl(id, audioType));
		au.current = a;
		setPlaying(true);

		const container = containerId ? document.getElementById(containerId) : null;
		const spans = container?.children;
		const n = spans?.length ?? 0;

		function tick() {
			if (!a || a.paused || a.ended) {
				setPlaying(false);
				stopKaraoke();
				return;
			}
			if (n > 0 && spans) {
				const idx = Math.min(
					Math.floor(a.currentTime / ((a.duration || 1) / n)),
					n - 1,
				);
				for (let i = 0; i < n; i++) spans[i].classList.toggle("kc", i === idx);
			}
			raf.current = requestAnimationFrame(tick);
		}

		a.addEventListener(
			"play",
			() => {
				raf.current = requestAnimationFrame(tick);
			},
			{ once: true },
		);
		a.addEventListener(
			"ended",
			() => {
				setPlaying(false);
				stopKaraoke();
			},
			{ once: true },
		);
		a.play().catch(() => setPlaying(false));
	}

	if (small) {
		return (
			<button
				type="button"
				className={`inline-flex items-center justify-center p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors ${playing ? "text-primary" : ""}`}
				onClick={play}
				title="Phát âm"
			>
				{playing ? (
					<Square size={9} fill="currentColor" />
				) : (
					<Volume2 size={10} />
				)}
			</button>
		);
	}

	return (
		<button
			type="button"
			className={`inline-flex items-center justify-center size-8 rounded-full border border-border bg-background hover:bg-muted transition-colors ${playing ? "text-primary border-primary" : "text-muted-foreground"}`}
			onClick={play}
			title="Phát âm"
		>
			{playing ? (
				<Square size={13} fill="currentColor" />
			) : (
				<Volume2 size={15} />
			)}
		</button>
	);
}
