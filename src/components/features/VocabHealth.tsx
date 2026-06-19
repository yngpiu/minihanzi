import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useWords } from "@/hooks/queries";
import { dbToCard, getRetrievability } from "@/lib/fsrs";
import type { WordWithReview } from "@/lib/types";

const COLORS = {
	mastered: "#22c55e",
	learning: "#eab308",
	forgotten: "#ef4444",
};

function toCard(w: WordWithReview) {
	if (!w.word_review) return null;
	return dbToCard(w.word_review);
}

export function VocabHealth() {
	const { data: words, isLoading } = useWords();

	const data = useMemo(() => {
		if (!words || words.length === 0) return [];

		const now = new Date();
		let mastered = 0;
		let learning = 0;
		let forgotten = 0;

		for (const w of words) {
			const card = toCard(w);
			if (!card) {
				forgotten++;
				continue;
			}
			const r = getRetrievability(card, now);

			if (card.state === 0) {
				forgotten++;
			} else if (card.state === 1 || card.state === 3) {
				learning++;
			} else if (r < 0.7) {
				forgotten++;
			} else if (r < 0.9) {
				learning++;
			} else {
				mastered++;
			}
		}

		return [
			{ name: "Thuộc lòng", value: mastered, color: COLORS.mastered },
			{ name: "Đang học", value: learning, color: COLORS.learning },
			{ name: "Cần ôn lại", value: forgotten, color: COLORS.forgotten },
		].filter((d) => d.value > 0);
	}, [words]);

	const total = data.reduce((s, d) => s + d.value, 0);

	if (isLoading || !words || words.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<div className="text-sm text-muted-foreground">Sức khoẻ từ vựng</div>
			<ResponsiveContainer width="100%" height={200}>
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={50}
						outerRadius={80}
						paddingAngle={2}
						dataKey="value"
					>
						{data.map((entry) => (
							<Cell key={entry.name} fill={entry.color} />
						))}
					</Pie>
					<Tooltip
						formatter={(value: number) => [
							`${value} từ (${((value / total) * 100).toFixed(0)}%)`,
						]}
					/>
				</PieChart>
			</ResponsiveContainer>
			<div className="flex justify-center gap-4 text-xs">
				{data.map((d) => (
					<div key={d.name} className="flex items-center gap-1">
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: d.color }}
						/>
						<span className="text-muted-foreground">{d.name}</span>
						<span className="font-medium">{d.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}
