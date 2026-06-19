import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Label,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import { ContributeGraph } from "@/components/features/ContributeGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { useStudyLogs, useWords } from "@/hooks/queries";
import { getMasteryLevel } from "@/lib/srs";
import type { StudyLog } from "@/lib/types";

export const Route = createFileRoute("/analytics")({
	component: AnalyticsPage,
});

function AnalyticsPage() {
	const { data: logs } = useStudyLogs(365);
	const { data: words } = useWords();

	const barData = useMemo(() => buildBarData(logs ?? []), [logs]);

	const masteryData = useMemo(() => buildMasteryData(words ?? []), [words]);
	const totalWords = masteryData.reduce((s, d) => s + d.value, 0);

	return (
		<div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Thống kê</h1>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Phân bố trình độ</CardTitle>
					</CardHeader>
					<CardContent>
						{words && words.length > 0 ? (
							<MasteryDonut data={masteryData} total={totalWords} />
						) : (
							<div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
								Chưa có dữ liệu
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ôn tập 30 ngày</CardTitle>
					</CardHeader>
					<CardContent>
						{barData.length > 0 ? (
							<DailyBarChart data={barData} />
						) : (
							<div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
								Chưa có dữ liệu
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Đóng góp trong năm</CardTitle>
					</CardHeader>
					<CardContent>
						<ContributeGraph logs={logs ?? []} days={365} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

const barConfig = {
	words: {
		label: "Từ đã học",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

function DailyBarChart({ data }: { data: { date: string; words: number }[] }) {
	return (
		<ChartContainer config={barConfig} className="min-h-[200px] w-full">
			<BarChart accessibilityLayer data={data}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="date"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(v: string) => v.slice(5)}
				/>
				<YAxis
					allowDecimals={false}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent hideLabel />}
				/>
				<Bar dataKey="words" fill="var(--color-words)" radius={[6, 6, 0, 0]} />
			</BarChart>
		</ChartContainer>
	);
}

const pieConfig = {
	unstudied: { label: "Chưa học", color: "var(--chart-5)" },
	learning: { label: "Đang học", color: "var(--chart-3)" },
	reviewing: { label: "Cần ôn", color: "var(--chart-2)" },
	familiar: { label: "Quen", color: "var(--chart-1)" },
	mastered: { label: "Đã thuộc", color: "var(--chart-4)" },
} satisfies ChartConfig;

function MasteryDonut({
	data,
	total,
}: {
	data: { level: string; value: number; fill: string }[];
	total: number;
}) {
	const filtered = data.filter((d) => d.value > 0);

	return (
		<div className="space-y-3">
			<ChartContainer
				config={pieConfig}
				className="mx-auto aspect-square max-h-[220px]"
			>
				<PieChart>
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Pie
						data={filtered}
						dataKey="value"
						nameKey="level"
						innerRadius={55}
						strokeWidth={4}
					>
						<Label
							content={({ viewBox }) => {
								if (viewBox && "cx" in viewBox && "cy" in viewBox) {
									return (
										<text
											x={viewBox.cx}
											y={viewBox.cy}
											textAnchor="middle"
											dominantBaseline="middle"
										>
											<tspan
												x={viewBox.cx}
												y={viewBox.cy}
												className="fill-foreground text-2xl font-bold"
											>
												{total}
											</tspan>
											<tspan
												x={viewBox.cx}
												y={(viewBox.cy ?? 0) + 20}
												className="fill-muted-foreground text-xs"
											>
												từ
											</tspan>
										</text>
									);
								}
							}}
						/>
					</Pie>
				</PieChart>
			</ChartContainer>
			<div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
				{data.map((d) => (
					<div key={d.level} className="flex items-center gap-1.5">
						<div
							className="h-2 w-2 shrink-0 rounded-[2px]"
							style={{ backgroundColor: d.fill }}
						/>
						<span className="text-muted-foreground">
							{pieConfig[d.level as keyof typeof pieConfig]?.label ?? d.level}
						</span>
						<span className="font-medium tabular-nums">{d.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function buildBarData(logs: StudyLog[]) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const days: { date: string; words: number }[] = [];

	for (let i = 29; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		const log = logs.find((l) => l.date === dateStr);
		days.push({
			date: dateStr,
			words: log ? (log.words_reviewed ?? 0) + (log.words_added ?? 0) : 0,
		});
	}
	return days;
}

function buildMasteryData(
	words: {
		word_review: { interval_level: number; total_reviews: number } | null;
	}[],
) {
	const counts: Record<string, number> = {
		unstudied: 0,
		learning: 0,
		reviewing: 0,
		familiar: 0,
		mastered: 0,
	};

	for (const w of words) {
		const level = getMasteryLevel(
			w.word_review?.interval_level ?? 0,
			w.word_review?.total_reviews ?? 0,
		);
		counts[level]++;
	}

	const colorMap: Record<string, string> = {
		unstudied: "var(--chart-5)",
		learning: "var(--chart-3)",
		reviewing: "var(--chart-2)",
		familiar: "var(--chart-1)",
		mastered: "var(--chart-4)",
	};

	return Object.entries(counts).map(([level, value]) => ({
		level,
		value,
		fill: colorMap[level],
	}));
}
