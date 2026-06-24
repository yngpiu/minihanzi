import { useEffect, useState } from "react";
import { lookupCharacter } from "@/lib/dictionary-parser";
import { DecompositionTree } from "./DecompositionTree";

interface Props {
	hanzi: string;
	onPinyinDetected?: (pinyin: string) => void;
}

export function CharInfoCard({ hanzi, onPinyinDetected }: Props) {
	const [info, setInfo] = useState<{
		pinyin: string[];
		radical?: string;
		decomposition?: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [notified, setNotified] = useState(false);

	useEffect(() => {
		if (!hanzi || hanzi.length !== 1) {
			setInfo(null);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setNotified(false);
		lookupCharacter(hanzi).then((result) => {
			if (cancelled) return;
			if (result) {
				setInfo({
					pinyin: result.pinyin,
					radical: result.radical,
					decomposition: result.decomposition,
				});
				if (!notified && result.pinyin?.length && onPinyinDetected) {
					onPinyinDetected(result.pinyin.join(", "));
				}
			} else {
				setInfo(null);
			}
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [hanzi, onPinyinDetected, notified]);

	if (!hanzi || hanzi.length > 1) return null;

	return (
		<div className="rounded-xl border bg-gradient-to-br from-card to-muted/20 p-4 space-y-3">
			<div className="flex items-start gap-4">
				{/* Character */}
				<div className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/[0.04] text-3xl font-serif shadow-sm">
					{hanzi}
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0 space-y-1.5">
					{loading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<div className="size-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
							Đang tra cứu...
						</div>
					) : info ? (
						<>
							{info.pinyin.length > 0 && (
								<div className="flex items-center gap-2">
									<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Pinyin
									</span>
									<span className="text-sm font-medium text-foreground">
										{info.pinyin.join(", ")}
									</span>
								</div>
							)}
							<div className="flex flex-wrap gap-x-4 gap-y-1">
								{info.radical && (
									<div className="flex items-center gap-1.5">
										<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Bộ thủ
										</span>
										<span className="inline-flex items-center justify-center size-6 rounded border bg-background text-sm font-serif">
											{info.radical}
										</span>
									</div>
								)}
							</div>
						</>
					) : (
						<p className="text-xs text-muted-foreground italic">
							Không tìm thấy thông tin
						</p>
					)}
				</div>
			</div>

			{/* Decomposition diagram */}
			{info?.decomposition && (
				<div className="flex justify-center pt-1 border-t">
					<DecompositionTree decomposition={info.decomposition} />
				</div>
			)}
		</div>
	);
}
