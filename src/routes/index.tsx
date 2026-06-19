import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookMarked, GraduationCap, Library } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Label,
	Pie,
	PieChart,
	XAxis,
} from "recharts";
import { ContributeGraph } from "@/components/features/ContributeGraph";
import { Flashcard } from "@/components/features/Flashcard";
import { StatCard } from "@/components/features/StatCard";
import { StudyStreak } from "@/components/features/StudyStreak";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useStudyLogs, useWords } from "@/hooks/queries";
import { getMasteryLevel } from "@/lib/srs";
import type { StudyLog } from "@/lib/types";

export const Route = createFileRoute("/")({
	component: Dashboard,
});

function Dashboard() {
	useEffect(() => { document.title = "Dashboard - Minihanzi"; }, []);
	const { data: stats, isLoading, error } = useDashboardStats();
	const { data: logs } = useStudyLogs(30);
	const { data: words } = useWords();
	const [reviewing, setReviewing] = useState(false);

	const isTodayComplete = stats
		? stats.dueToday === 0 && stats.todayReviewed > 0
		: false;

	const barData = useMemo(() => buildBarData(logs ?? []), [logs]);

	const masteryData = useMemo(() => buildMasteryData(words ?? []), [words]);
	const totalWords = masteryData.reduce((s, d) => s + d.value, 0);

	if (error) {
		console.error("[Dashboard]", error);
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
				<div className="text-8xl font-kai text-primary/20 select-none">歉</div>
				<p className="text-lg text-muted-foreground">Lỗi kết nối dữ liệu.</p>
				<p className="text-sm text-muted-foreground max-w-md">
					{error.message}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{reviewing ? "Ôn tập" : "Dashboard"}
					</h1>
				</div>
				{reviewing && (
					<Button variant="ghost" onClick={() => setReviewing(false)}>
						<ArrowLeft size={16} />
						Quay lại
					</Button>
				)}
			</div>

			{reviewing ? (
				<Flashcard
					compact
					onComplete={() => {
						setReviewing(false);
					}}
				/>
			) : (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{isLoading ? (
							<>
								<Skeleton className="h-28" />
								<Skeleton className="h-28" />
								<Skeleton className="h-28" />
								<Skeleton className="h-28" />
							</>
						) : (
							<>
								<StudyStreak
									streak={stats?.streak ?? 0}
									completedToday={isTodayComplete}
								/>
								<StatCard
									icon={GraduationCap}
									value={stats?.dueToday ?? 0}
									label="Cần ôn hôm nay"
								/>
								<StatCard
									icon={Library}
									value={stats?.totalWords ?? 0}
									label="Tổng từ vựng"
								/>
								<StatCard
									icon={BookMarked}
									value={stats?.todayReviewed ?? 0}
									label="Đã học hôm nay"
								/>
							</>
						)}
					</div>

					{!isLoading && stats && stats.totalWords === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center gap-4 py-12">
								<div className="text-7xl font-kai text-primary/20 select-none">
									词
								</div>
								<h2 className="text-xl font-semibold">
									Chào mừng đến với Hanzier!
								</h2>
								<Link to="/vocabulary">
									<Button size="lg">
										<BookMarked size={16} />
										Thêm từ vựng
									</Button>
								</Link>
							</CardContent>
						</Card>
					) : (
						<>
							{!isLoading && stats && (
								<Button
									size="lg"
									className="w-full gap-2 text-base h-14"
									variant={stats.dueToday > 0 ? "default" : "outline"}
									disabled={stats.dueToday === 0}
									onClick={() => setReviewing(true)}
								>
									<GraduationCap size={20} />
									{stats.dueToday > 0
										? `Học ngay hôm nay (${stats.dueToday} từ cần ôn)`
										: "Bạn đã hoàn thành bài học hôm nay!"}
								</Button>
							)}

							{isLoading && <Skeleton className="h-14 w-full" />}

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<DailyReviewChart data={barData} />
								<MasteryChart data={masteryData} total={totalWords} />
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Đóng góp</CardTitle>
								</CardHeader>
								<CardContent>
									<ContributeGraph logs={logs ?? []} days={30} />
								</CardContent>
							</Card>
						</>
					)}
				</>
			)}
		</div>
	);
}

const barChartConfig = {
	reviews: {
		label: "Đã học",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

function DailyReviewChart({
	data,
}: {
	data: { date: string; reviews: number }[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Ôn tập 14 ngày</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={barChartConfig}
					className="min-h-[200px] w-full"
				>
					<BarChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(v: string) => v.slice(5)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar dataKey="reviews" fill="var(--color-reviews)" radius={6} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

const pieChartConfig = {
	unstudied: { label: "Chưa học", color: "var(--chart-5)" },
	learning: { label: "Đang học", color: "var(--chart-3)" },
	reviewing: { label: "Cần ôn", color: "var(--chart-2)" },
	familiar: { label: "Quen", color: "var(--chart-1)" },
	mastered: { label: "Đã thuộc", color: "var(--chart-4)" },
} satisfies ChartConfig;

function MasteryChart({
	data,
	total,
}: {
	data: { level: string; value: number; fill: string }[];
	total: number;
}) {
	const filtered = data.filter((d) => d.value > 0);

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<CardTitle>Phân bố trình độ</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={pieChartConfig}
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
			</CardContent>
			<div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 pb-4 text-xs">
				{data.map((d) => (
					<div key={d.level} className="flex items-center gap-1.5">
						<div
							className="h-2 w-2 shrink-0 rounded-[2px]"
							style={{ backgroundColor: d.fill }}
						/>
						<span className="text-muted-foreground">
							{pieChartConfig[d.level as keyof typeof pieChartConfig]?.label ??
								d.level}
						</span>
						<span className="font-medium tabular-nums">{d.value}</span>
					</div>
				))}
			</div>
		</Card>
	);
}

function buildBarData(logs: StudyLog[]) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const days: { date: string; reviews: number }[] = [];

	for (let i = 13; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		const log = logs.find((l) => l.date === dateStr);
		days.push({
			date: dateStr,
			reviews: log ? (log.words_reviewed ?? 0) + (log.words_added ?? 0) : 0,
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
