import type { StudyLog } from "@/lib/types";

interface ContributeGraphProps {
	logs: StudyLog[];
	days?: number;
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_LABELS = [
	"Th1",
	"Th2",
	"Th3",
	"Th4",
	"Th5",
	"Th6",
	"Th7",
	"Th8",
	"Th9",
	"Th10",
	"Th11",
	"Th12",
];

export function ContributeGraph({ logs, days = 30 }: ContributeGraphProps) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	type Cell = { date: Date; count: number; dateStr: string };

	const allCells: Cell[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		const log = logs.find((l) => l.date === dateStr);
		allCells.push({
			date: d,
			dateStr,
			count: log ? (log.words_reviewed ?? 0) + (log.words_added ?? 0) : 0,
		});
	}

	const maxCount = Math.max(...allCells.map((c) => c.count), 1);

	function intensity(c: number) {
		if (c === 0) return "bg-muted";
		const pct = c / maxCount;
		if (pct <= 0.25) return "bg-green-200 dark:bg-green-900";
		if (pct <= 0.5) return "bg-green-400 dark:bg-green-700";
		if (pct <= 0.75) return "bg-green-500 dark:bg-green-600";
		return "bg-green-600 dark:bg-green-500";
	}

	const isCalendar = days > 60;

	if (isCalendar) {
		return <CalendarHeatmap cells={allCells} intensity={intensity} />;
	}

	return <InlineHeatmap cells={allCells} intensity={intensity} />;
}

function InlineHeatmap({
	cells,
	intensity,
}: {
	cells: { date: Date; count: number }[];
	intensity: (c: number) => string;
}) {
	const total = cells.length;
	const chunkEvery = Math.max(1, Math.floor(total / 6));

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-[3px]">
				{cells.map((c) => (
					<div
						key={c.date.toISOString()}
						className={`h-3 w-3 rounded-[3px] ${intensity(c.count)}`}
						title={`${c.date.toLocaleDateString("vi-VN")}: ${c.count} từ`}
					/>
				))}
			</div>
			<div className="flex justify-between text-[10px] text-muted-foreground">
				{cells
					.filter((_, i) => i % chunkEvery === 0)
					.map((c) => (
						<span key={c.date.toISOString()}>
							{c.date.toLocaleDateString("vi-VN", {
								day: "numeric",
								month: "numeric",
							})}
						</span>
					))}
				<span>
					{cells[cells.length - 1]?.date.toLocaleDateString("vi-VN", {
						day: "numeric",
						month: "numeric",
					})}
				</span>
			</div>
			<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
				<span>Ít</span>
				<div className="h-2 w-2 rounded-[2px] bg-muted" />
				<div className="h-2 w-2 rounded-[2px] bg-green-200 dark:bg-green-900" />
				<div className="h-2 w-2 rounded-[2px] bg-green-400 dark:bg-green-700" />
				<div className="h-2 w-2 rounded-[2px] bg-green-500 dark:bg-green-600" />
				<div className="h-2 w-2 rounded-[2px] bg-green-600 dark:bg-green-500" />
				<span>Nhiều</span>
			</div>
		</div>
	);
}

function CalendarHeatmap({
	cells,
	intensity,
}: {
	cells: { date: Date; count: number; dateStr: string }[];
	intensity: (c: number) => string;
}) {
	const weeks: ((typeof cells)[number] | null)[][] = [];
	let currentWeek: ((typeof cells)[number] | null)[] = [];

	for (const cell of cells) {
		const dayOfWeek = cell.date.getDay();
		while (currentWeek.length < dayOfWeek) {
			currentWeek.push(null);
		}
		currentWeek.push(cell);
		if (dayOfWeek === 6) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
	}
	if (currentWeek.length > 0) {
		while (currentWeek.length < 7) {
			currentWeek.push(null);
		}
		weeks.push(currentWeek);
	}

	const monthLabels: { label: string; col: number; span: number }[] = [];
	for (let wi = 0; wi < weeks.length; wi++) {
		const firstCell = weeks[wi].find((c) => c !== null);
		if (!firstCell) continue;
		const m = firstCell.date.getMonth();
		if (
			monthLabels.length === 0 ||
			monthLabels[monthLabels.length - 1].label !== MONTH_LABELS[m]
		) {
			monthLabels.push({ label: MONTH_LABELS[m], col: wi, span: 1 });
		} else {
			monthLabels[monthLabels.length - 1].span++;
		}
	}

	const cellSize = 13;
	const gap = 3;

	return (
		<div className="space-y-1 overflow-x-auto">
			{/* Month labels */}
			<div
				className="relative h-4 text-[10px] text-muted-foreground"
				style={{ minWidth: weeks.length * (cellSize + gap) }}
			>
				{monthLabels.map((ml) => (
					<span
						key={ml.col}
						className="absolute top-0"
						style={{
							left: ml.col * (cellSize + gap),
						}}
					>
						{ml.label}
					</span>
				))}
			</div>

			<div
				className="flex gap-[3px]"
				style={{ minWidth: weeks.length * (cellSize + gap) }}
			>
				{/* Day labels column */}
				<div className="flex flex-col gap-[3px] pr-1 pt-0">
					{[1, 3, 5].map((d) => (
						<div
							key={d}
							className="text-[10px] text-muted-foreground leading-none flex items-center"
							style={{ height: cellSize }}
						>
							{DAY_LABELS[d]}
						</div>
					))}
				</div>

				{/* Grid */}
				{weeks.map((week, wi) => (
					<div key={wi} className="flex flex-col gap-[3px]">
						{week.map((cell, di) =>
							cell ? (
								<div
									key={cell.dateStr}
									className={`rounded-[3px] ${intensity(cell.count)}`}
									style={{ width: cellSize, height: cellSize }}
									title={`${cell.date.toLocaleDateString("vi-VN")}: ${cell.count} từ`}
								/>
							) : (
								<div
									key={`${wi}-${di}`}
									style={{ width: cellSize, height: cellSize }}
								/>
							),
						)}
					</div>
				))}
			</div>

			<div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1">
				<span>Ít</span>
				<div className="h-2 w-2 rounded-[2px] bg-muted" />
				<div className="h-2 w-2 rounded-[2px] bg-green-200 dark:bg-green-900" />
				<div className="h-2 w-2 rounded-[2px] bg-green-400 dark:bg-green-700" />
				<div className="h-2 w-2 rounded-[2px] bg-green-500 dark:bg-green-600" />
				<div className="h-2 w-2 rounded-[2px] bg-green-600 dark:bg-green-500" />
				<span>Nhiều</span>
			</div>
		</div>
	);
}
