import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Play } from "lucide-react";
import {
	createContext,
	type MouseEvent,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { usePhonetic } from "@/hooks/queries/useVocabulary";

export const Route = createFileRoute("/phonetic")({
	component: PhoneticPage,
});

type HighlightApi = {
	onEnter: (row: string, col: string) => void;
	onLeave: () => void;
};

const HighlightCtx = createContext<HighlightApi | null>(null);

async function playAudio(url: string | null) {
	if (!url) return;
	try {
		const audio = new Audio(url);
		await audio.play();
	} catch {}
}

function PhoneticPage() {
	const { data: cells, isLoading } = usePhonetic();

	const gridRef = useRef<HTMLDivElement>(null);

	const { initials, finals } = useMemo(() => {
		if (!cells) return { initials: [], finals: [] };

		const headerRows = cells.filter((c) => c.row_idx === 0 && c.col_idx >= 2);
		const initials = headerRows
			.filter((c) => !c.is_null && c.text[0])
			.map((c) => ({ label: c.text[0], col: c.col_idx }));

		const finalRows = cells.filter((c) => c.row_idx >= 1);
		const rowMap = new Map<
			number,
			{ label: string; cells: (typeof cells)[number][] }
		>();
		for (const c of finalRows) {
			const row = rowMap.get(c.row_idx) ?? { label: "", cells: [] };
			rowMap.set(c.row_idx, row);
			if (c.col_idx === 0) row.label = c.text[0] ?? "";
			row.cells.push(c);
		}
		const finals = Array.from(rowMap.entries())
			.sort(([a], [b]) => a - b)
			.map(([, v]) => ({
				label: v.label,
				cells: v.cells.sort((a, b) => a.col_idx - b.col_idx),
			}));

		return { initials, finals };
	}, [cells]);

	const api = useMemo<HighlightApi>(
		() => ({
			onEnter(row, col) {
				const g = gridRef.current;
				if (!g) return;
				g.querySelectorAll(".hc").forEach((el) => {
					el.classList.remove("hc");
				});
				g.querySelectorAll(`[data-r="${row}"]`).forEach((el) => {
					el.classList.add("hc");
				});
				g.querySelectorAll(`[data-c="${col}"]`).forEach((el) => {
					el.classList.add("hc");
				});
			},
			onLeave() {
				gridRef.current?.querySelectorAll(".hc").forEach((el) => {
					el.classList.remove("hc");
				});
			},
		}),
		[],
	);

	const handleOver = useCallback(
		(e: MouseEvent) => {
			const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-r]");
			if (!cell) return;
			const r = cell.dataset.r;
			const c = cell.dataset.c;
			if (r && c) api.onEnter(r, c);
		},
		[api],
	);

	const handleLeave = useCallback(() => {
		api.onLeave();
	}, [api]);

	useEffect(() => {
		document.title = "Bảng phiên âm - Minihanzi";
	}, []);

	if (isLoading) {
		return (
			<div className="p-4 md:p-6">
				<h1 className="text-2xl font-bold tracking-tight mb-1">
					Bảng phiên âm
				</h1>
				<div className="flex items-center justify-center h-64 text-muted-foreground">
					<Loader2 size={24} className="animate-spin mr-2" />
					Đang tải…
				</div>
			</div>
		);
	}

	return (
		<HighlightCtx.Provider value={api}>
			<div className="p-4 md:p-6">
				<h1 className="text-2xl font-bold tracking-tight mb-6">
					Bảng phiên âm
				</h1>

				<div className="overflow-x-auto rounded-lg border">
					{/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithMouseEvents: delegated hover highlight */}
					<div
						ref={gridRef}
						className="grid"
						style={{
							gridTemplateColumns: `80px 90px repeat(${initials.length}, minmax(72px, 1fr))`,
							minWidth: 640,
						}}
						onMouseOver={handleOver}
						onMouseOut={handleLeave}
					>
						<CellEmpty row={0} col={0} />
						<CellEmpty row={0} col={1} />
						{initials.map(({ label, col }) => (
							<CellHeader key={col} label={label} col={col} />
						))}

						{finals.map(({ label, cells: rowCells }) => {
							const rowIdx = rowCells[0]?.row_idx ?? 0;
							return <FinalRow key={rowIdx} label={label} cells={rowCells} />;
						})}
					</div>
				</div>
			</div>
		</HighlightCtx.Provider>
	);
}

const CellHeader = memo(function CellHeader({
	label,
	col,
}: {
	label: string;
	col: number;
}) {
	return (
		<button
			type="button"
			tabIndex={-1}
			className="flex items-center justify-center px-1 py-2 text-sm font-semibold bg-muted/50 text-muted-foreground border-r border-b border-border select-none"
			data-r="0"
			data-c={col}
		>
			{label}
		</button>
	);
});

const FinalRow = memo(function FinalRow({
	label,
	cells,
}: {
	label: string;
	cells: NonNullable<ReturnType<typeof usePhonetic>["data"]>[number][];
}) {
	const r = cells[0]?.row_idx ?? 0;
	return (
		<>
			<CellRowHeader label={label} row={r} />
			{cells.slice(1).map((cell) => {
				const col = cell.col_idx;
				if (cell.is_null) return <CellEmpty key={col} row={r} col={col} />;
				if (cell.type === 1) {
					return <CellHeader key={col} label={cell.text[0] ?? ""} col={col} />;
				}
				return <DataCell key={col} cell={cell} row={r} col={col} />;
			})}
		</>
	);
});

const CellRowHeader = memo(function CellRowHeader({
	label,
	row,
}: {
	label: string;
	row: number;
}) {
	return (
		<button
			type="button"
			tabIndex={-1}
			className="flex items-center justify-center px-1 py-2 text-sm font-semibold bg-muted/50 text-muted-foreground border-r border-b border-border select-none"
			data-r={row}
			data-c="0"
		>
			{label}
		</button>
	);
});

const CellEmpty = memo(function CellEmpty({
	row,
	col,
}: {
	row: number;
	col: number;
}) {
	return (
		<div
			className="border-r border-b border-border/40 bg-muted/10"
			data-r={row}
			data-c={col}
		/>
	);
});

function DataCell({
	cell,
	row,
	col,
}: {
	cell: NonNullable<ReturnType<typeof usePhonetic>["data"]>[number];
	row: number;
	col: number;
}) {
	const base = cell.text[0];
	const tones = cell.text.slice(1);
	const audioUrls = cell.audio?.slice(1) ?? [];
	const [open, setOpen] = useState(false);
	const hi = useContext(HighlightCtx);
	const r = String(row);
	const c = String(col);

	const handleHighlight = useCallback(() => {
		hi?.onEnter(r, c);
	}, [hi, r, c]);

	const handleClear = useCallback(() => {
		hi?.onLeave();
	}, [hi]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex items-center justify-center px-1 py-2 text-sm font-medium border-r border-b border-border cursor-pointer select-none hover:bg-accent/30"
					data-r={r}
					data-c={c}
				>
					{base}
				</button>
			</PopoverTrigger>
			<PopoverContent
				side="right"
				align="center"
				className="w-32 p-1"
				onMouseEnter={handleHighlight}
				onMouseLeave={handleClear}
			>
				<div className="flex flex-col gap-0.5">
					{tones.map((tone, i) => (
						<button
							key={i}
							type="button"
							className="flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm hover:bg-accent transition-colors cursor-pointer"
							onClick={() => playAudio(audioUrls[i])}
						>
							<span className="font-medium">{tone}</span>
							<span className="text-xs text-muted-foreground">
								<Play size={12} />
							</span>
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
