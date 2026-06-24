import type { WordMean } from "@/services/types";
import { translateKind } from "@/services/utils";
import { ExItem } from "./ExItem";

interface MeaningGroupProps {
	kind?: string;
	means?: WordMean[];
}

export function MeaningGroup({ kind, means }: MeaningGroupProps) {
	if (!means || means.length === 0) return null;

	return (
		<div className="space-y-4">
			{kind && (
				<h3 className="text-sm font-bold text-foreground">
					{translateKind(kind)}
				</h3>
			)}
			{means.map((m, mi) => (
				<div key={mi} className="space-y-2">
					<div className="flex gap-3">
						<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
							{mi + 1}
						</span>
						<div className="min-w-0 flex-1 space-y-2">
							<p className="text-sm font-medium">{m.mean}</p>
							{(m.examples || []).slice(0, 3).map((ex, ei) => (
								<ExItem key={ei} ex={ex} />
							))}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
