import { useId } from "react";
import { AudioBtn } from "@/components/AudioBtn";
import type { Example } from "@/services/types";
import { getKaraokeTokens } from "@/services/utils";

export function ExItem({ ex }: { ex: Example }) {
	const fallbackId = useId();
	const uid = `e-${ex._id || ex.id || fallbackId}`;
	const tokens = ex.e ? getKaraokeTokens(ex.e) : [];
	const py = ex.p || ex.p_cn || "";

	return (
		<div className="rounded-lg border bg-card p-3">
			<div className="flex items-center gap-3">
				<div className="flex-1 min-w-0 space-y-1">
					{ex.e && (
						<span id={uid}>
							{tokens.map((t, i) => (
								<span key={i}>{t.w}</span>
							))}
						</span>
					)}
					{py && <p className="text-xs text-muted-foreground">{py}</p>}
					{ex.m && <p className="text-sm">{ex.m}</p>}
				</div>
				{ex.id && (
					<AudioBtn
						id={ex.id}
						audioType={ex.type || "e_cnvi"}
						containerId={uid}
					/>
				)}
			</div>
		</div>
	);
}
