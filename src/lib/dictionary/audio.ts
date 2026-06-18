import { getAudioUrl } from "@/services/utils";

export function createAudioPlayer(
	id: number | string,
	audioType: string,
	onPlayStateChange?: (playing: boolean) => void,
): {
	play: (containerId?: string) => void;
	stop: () => void;
	getPlaying: () => boolean;
} {
	let playing = false;
	let raf = 0;
	let au: HTMLAudioElement | null = null;
	let containerId = "";

	function stopKaraoke() {
		cancelAnimationFrame(raf);
		if (containerId) {
			document
				.querySelectorAll(`#${CSS.escape(containerId)} .kc`)
				.forEach((el) => el.classList.remove("kc"));
		}
	}

	function play(cId?: string) {
		if (playing) {
			au?.pause();
			playing = false;
			onPlayStateChange?.(false);
			stopKaraoke();
			return;
		}

		containerId = cId || "";
		const a = new Audio(getAudioUrl(id, audioType));
		au = a;
		playing = true;
		onPlayStateChange?.(true);

		const container = containerId ? document.getElementById(containerId) : null;
		const spans = container?.children;
		const n = spans?.length ?? 0;

		function tick() {
			if (!a || a.paused || a.ended) {
				playing = false;
				onPlayStateChange?.(false);
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
			raf = requestAnimationFrame(tick);
		}

		a.addEventListener(
			"play",
			() => {
				raf = requestAnimationFrame(tick);
			},
			{ once: true },
		);
		a.addEventListener(
			"ended",
			() => {
				playing = false;
				onPlayStateChange?.(false);
				stopKaraoke();
			},
			{ once: true },
		);
		a.play().catch(() => {
			playing = false;
			onPlayStateChange?.(false);
		});
	}

	function stop() {
		au?.pause();
		playing = false;
		onPlayStateChange?.(false);
		stopKaraoke();
	}

	function getPlaying() {
		return playing;
	}

	return { play, stop, getPlaying };
}
