import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
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

const STORAGE_KEY = "phonetic-data";

export const Route = createFileRoute("/phonetic")({
	component: PhoneticPage,
});

type CellData = {
	text: string[];
	type: number;
	isNull?: boolean;
	audio: (string | null)[];
	join?: string;
};

async function getData(): Promise<CellData[][]> {
	const cached = localStorage.getItem(STORAGE_KEY);
	if (cached) return JSON.parse(cached) as CellData[][];
	const { default: raw } = await import("../../data/phonetic.json");
	localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
	return raw as CellData[][];
}

function usePhoneticData() {
	const [state, setState] = useState<{
		initials: { label: string; col: number }[];
		finals: { label: string; rowIndex: number; cells: CellData[] }[];
	} | null>(null);

	useEffect(() => {
		getData().then((data) => {
			const initials: { label: string; col: number }[] = [];
			const headerRow = data[0];
			for (let ci = 2; ci < headerRow.length; ci++) {
				const cell = headerRow[ci];
				if (cell && !cell.isNull && cell.text?.[0]) {
					initials.push({ label: cell.text[0], col: ci });
				}
			}
			const finals: { label: string; rowIndex: number; cells: CellData[] }[] =
				[];
			for (let ri = 1; ri < data.length; ri++) {
				const row = data[ri];
				const label = row[0]?.text?.[0] ?? "";
				finals.push({ label, rowIndex: ri, cells: row });
			}
			setState({ initials, finals });
		});
	}, []);

	return state;
}

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
	useEffect(() => { document.title = "Bảng phiên âm - Minihanzi"; }, []);
	const gridRef = useRef<HTMLDivElement>(null);
	const state = usePhoneticData();

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

	if (!state) {
		return (
			<div className="p-4 md:p-6">
				<h1 className="text-2xl font-bold tracking-tight mb-1">
					Bảng phiên âm
				</h1>
				<div className="flex items-center justify-center h-64 text-muted-foreground">
					Đang tải...
				</div>
			</div>
		);
	}

	const { initials, finals } = state;

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

						{finals.map(({ label, rowIndex, cells }) => (
							<FinalRow
								key={rowIndex}
								label={label}
								rowIndex={rowIndex}
								cells={cells}
							/>
						))}
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
	rowIndex,
	cells,
}: {
	label: string;
	rowIndex: number;
	cells: CellData[];
}) {
	const r = rowIndex;
	return (
		<>
			<CellRowHeader label={label} row={r} />
			{cells.slice(1).map((cell, ci) => {
				const col = ci + 1;
				if (cell.isNull) return <CellEmpty key={col} row={r} col={col} />;
				if (cell.type === 1) {
					return (
						<CellHeader key={col} label={cell.text?.[0] ?? ""} col={col} />
					);
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

const DataCell = memo(function DataCell({
	cell,
	row,
	col,
}: {
	cell: CellData;
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
});
