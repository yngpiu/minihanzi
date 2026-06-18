import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useWords } from "@/hooks/queries";

const COLORS = {
	mastered: "#22c55e",
	learning: "#eab308",
	forgotten: "#ef4444",
};

export function VocabHealth() {
	const { data: words, isLoading } = useWords();

	if (isLoading || !words || words.length === 0) {
		return null;
	}

	const now = new Date();
	const counts = { mastered: 0, learning: 0, forgotten: 0 };

	for (const w of words) {
		const level = w.word_review?.interval_level ?? 0;
		const nextReview = w.word_review?.next_review_at
			? new Date(w.word_review.next_review_at)
			: null;

		if (nextReview && nextReview <= now && level === 0) {
			counts.forgotten++;
		} else if (level >= 3) {
			counts.mastered++;
		} else if (level >= 1) {
			counts.learning++;
		} else {
			counts.forgotten++;
		}
	}

	const data = [
		{ name: "Thuộc lòng", value: counts.mastered, color: COLORS.mastered },
		{ name: "Đang học", value: counts.learning, color: COLORS.learning },
		{
			name: "Cần ôn lại",
			value: counts.forgotten,
			color: COLORS.forgotten,
		},
	].filter((d) => d.value > 0);

	const total = counts.mastered + counts.learning + counts.forgotten;

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
