import { memo } from "react";

interface DecompNode {
	char: string;
	children: DecompNode[];
	layout?: string;
}

const IDS_LAYOUTS: Record<string, string> = {
	"\u2FF0": "Tả hữu",
	"\u2FF1": "Thượng hạ",
	"\u2FF2": "Tả trung hữu",
	"\u2FF3": "Thượng trung hạ",
	"\u2FF4": "Toàn bao",
	"\u2FF5": "Bao thượng",
	"\u2FF6": "Bao hạ",
	"\u2FF7": "Bao tả",
	"\u2FF8": "Bao tả thượng",
	"\u2FF9": "Bao hữu thượng",
	"\u2FFA": "Bao tả hạ",
	"\u2FFB": "Chồng",
};

const IDS_SET = new Set(Object.keys(IDS_LAYOUTS));

function parseIds(input: string, idx: number): [DecompNode, number] {
	if (idx >= input.length) {
		return [{ char: "", children: [] }, idx];
	}

	const ch = input[idx];

	if (IDS_SET.has(ch)) {
		const children: DecompNode[] = [];
		let pos = idx + 1;

		const childCount = ch === "\u2FF2" || ch === "\u2FF3" ? 3 : 2;

		for (let i = 0; i < childCount; i++) {
			const [child, nextPos] = parseIds(input, pos);
			if (child.char || child.children.length > 0) {
				children.push(child);
			}
			pos = nextPos;
		}

		return [{ char: "", children, layout: IDS_LAYOUTS[ch] }, pos];
	}

	return [{ char: ch, children: [] }, idx + 1];
}

function DecompNodeView({ node }: { node: DecompNode }) {
	if (node.children.length === 0) {
		return (
			<div className="flex flex-col items-center gap-0.5">
				<div className="flex size-10 items-center justify-center rounded-lg border-2 border-border bg-card text-lg font-serif shadow-sm">
					{node.char || "?"}
				</div>
			</div>
		);
	}

	const isH = node.layout === "Tả hữu" || node.layout === "Tả trung hữu";
	const isV = node.layout === "Thượng hạ" || node.layout === "Thượng trung hạ";

	return (
		<div className="flex flex-col items-center gap-1.5">
			{node.layout && (
				<span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
					{node.layout}
				</span>
			)}

			<div
				className={
					isH
						? "flex items-center gap-2"
						: isV
							? "flex flex-col items-center gap-2"
							: "flex items-center gap-2"
				}
			>
				{node.children.map((child, i) => (
					<div key={i} className="flex flex-col items-center">
						{i > 0 && isH && (
							<div className="hidden sm:block w-4 h-px bg-border -mr-2" />
						)}
						<DecompNodeView node={child} />
					</div>
				))}
			</div>
		</div>
	);
}

function DecompositionTreeImpl({ decomposition }: { decomposition: string }) {
	const [root] = parseIds(decomposition, 0);

	if (!root.char && root.children.length === 0) return null;

	return (
		<div className="inline-flex flex-col items-center gap-2 p-3 rounded-xl border bg-card/50">
			{root.char ? (
				<div className="flex size-12 items-center justify-center rounded-lg border-2 border-primary/40 bg-primary/5 text-2xl font-serif shadow-sm">
					{root.char}
				</div>
			) : (
				<div className="flex items-center gap-2">
					{root.children.map((child, i) => (
						<DecompNodeView key={i} node={child} />
					))}
				</div>
			)}
			{root.layout && (
				<span className="text-[11px] text-muted-foreground italic">
					Cấu tạo: {root.layout}
				</span>
			)}
		</div>
	);
}

const DecompositionTree = memo(DecompositionTreeImpl);
export { DecompositionTree };
