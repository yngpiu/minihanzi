import type { ExampleData } from "@/lib/types";

interface Props {
	data: ExampleData | null;
}

export function ExampleDisplay({ data }: Props) {
	if (!data) return null;

	return (
		<div className="space-y-0.5">
			<div className="flex items-baseline gap-2">
				<span className="text-muted-foreground text-xs w-16 shrink-0 font-medium">
					Chữ Hán:
				</span>
				<span className="font-kai">{data.hanzi}</span>
			</div>
			<div className="flex items-baseline gap-2">
				<span className="text-muted-foreground text-xs w-16 shrink-0 font-medium">
					Pinyin:
				</span>
				<span className="text-muted-foreground text-sm">{data.pinyin}</span>
			</div>
			<div className="flex items-baseline gap-2">
				<span className="text-muted-foreground text-xs w-16 shrink-0 font-medium">
					Nghĩa:
				</span>
				<span className="italic text-sm">{data.meaning}</span>
			</div>
		</div>
	);
}
