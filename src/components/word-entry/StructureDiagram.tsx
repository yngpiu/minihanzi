import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useStructureTree } from "@/hooks/queries/useStructureTree";
import type { StructureNode } from "@/services/types";

const IDS_LABELS: Record<string, string> = {
	"\u2FF0": "Tả hữu",
	"\u2FF1": "Thượng hạ",
	"\u2FF2": "Tả trung hữu",
	"\u2FF3": "Thượng trung hạ",
	"\u2FF4": "Toàn bao",
	"\u2FF5": "Bao thượng",
	"\u2FF6": "Bao hạ",
	"\u2FF7": "Bao tả",
	"\u2FF8": "Bao tả thượng",
	"\u2FF9": "Bao hạ thượng",
	"\u2FFA": "Bao hữu thượng",
	"\u2FFB": "Chồng",
};

export function StructureDiagram({
	hinhthai,
	comps,
	char,
}: {
	hinhthai: string;
	comps?: string[];
	char: string;
}) {
	const [open, setOpen] = useState(false);
	const { getNode, isLoading } = useStructureTree(open ? [char] : []);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] leading-4 border border-dashed text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
			>
				<svg
					viewBox="0 0 24 24"
					className="size-3.5"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6.88837 13.8579C5.64573 13.8579 4.63837 14.8652 4.63837 16.1079V17.6058H3.13837V16.1079C3.13837 14.0368 4.8173 12.3579 6.88837 12.3579H16.9569C19.028 12.3579 20.7069 14.0368 20.7069 16.1079V17.6058H19.2069V16.1079C19.2069 14.8652 18.1996 13.8579 16.9569 13.8579H6.88837Z"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12.7961 8.47879V16.9235H11.2961V8.47879H12.7961Z"
					/>
					<path d="M15.8788 5.67764C15.8788 7.79439 14.1629 9.51035 12.0461 9.51035C9.9294 9.51035 8.21344 7.79439 8.21344 5.67764C8.21344 3.5609 9.9294 1.84494 12.0461 1.84494C14.1629 1.84494 15.8788 3.5609 15.8788 5.67764Z" />
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12.0461 8.51035C13.6106 8.51035 14.8788 7.2421 14.8788 5.67764C14.8788 4.11318 13.6106 2.84494 12.0461 2.84494C10.4817 2.84494 9.21344 4.11318 9.21344 5.67764C9.21344 7.2421 10.4817 8.51035 12.0461 8.51035Z"
					/>
				</svg>
				<span>Sơ đồ bộ thủ</span>
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-[520px] max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							Sơ đồ bộ thủ
							<span className="font-mono text-lg text-foreground">{char}</span>
						</DialogTitle>
						<DialogClose />
					</DialogHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
							<Loader2 size={18} className="animate-spin" />
							<span>Đang phân tích…</span>
						</div>
					) : (
						<div className="py-2">
							{(() => {
								const node = getNode(char);
								if (!node) {
									return (
										<p className="text-xs text-muted-foreground italic text-center py-4">
											Không có dữ liệu cấu trúc
										</p>
									);
								}
								return <TreeNode node={node} depth={0} />;
							})()}
						</div>
					)}

					<div className="pt-1.5 border-t text-[10px] text-muted-foreground/50 flex items-center gap-2">
						<span>IDS: {hinhthai}</span>
						{comps && comps.length > 0 && (
							<span>Thành phần: {comps.join(", ")}</span>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

function TreeNode({ node, depth }: { node: StructureNode; depth: number }) {
	const ids = node.hinhthai ? node.hinhthai.split(",")[0] : "";
	const label = IDS_LABELS[ids];

	if (!node.comps || node.comps.length === 0) {
		return (
			<div className="flex flex-col items-center gap-1">
				<div className="size-12 flex items-center justify-center rounded-lg border-2 border-muted bg-card text-2xl font-mono shadow-sm">
					{node.char}
				</div>
				{node.sets && (
					<span className="text-[10px] text-muted-foreground uppercase">
						{node.sets}
					</span>
				)}
				<span className="text-[10px] text-muted-foreground/60">Bộ thủ</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="size-12 flex items-center justify-center rounded-lg border-2 border-primary/40 bg-primary/5 text-2xl font-mono shadow-sm">
				{node.char}
			</div>

			<div className="flex items-center gap-1.5">
				<span className="font-mono text-xs">{ids}</span>
				{label && (
					<span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
						{label}
					</span>
				)}
			</div>

			{node.sets && (
				<span className="text-[10px] text-muted-foreground uppercase -mt-1">
					{node.sets}
				</span>
			)}

			<div className="relative pt-3 w-full">
				{depth > 0 && (
					<div className="absolute left-1/2 top-0 w-px h-3 bg-border -translate-x-1/2" />
				)}

				{ids === "\u2FF0" ? (
					<div className="flex justify-center gap-6">
						{node.comps.map((child, i) => (
							<div key={i} className="flex flex-col items-center relative">
								{depth > 0 && (
									<div className="absolute -top-3 left-1/2 w-px h-3 bg-border -translate-x-1/2" />
								)}
								<TreeNode node={child} depth={depth + 1} />
							</div>
						))}
					</div>
				) : ids === "\u2FF1" ? (
					<div className="flex flex-col items-center gap-4">
						{node.comps.map((child, i) => (
							<div key={i} className="flex flex-col items-center relative">
								{i === 1 && depth > 0 && (
									<div className="absolute -top-2 left-1/2 w-px h-4 bg-border -translate-x-1/2" />
								)}
								<TreeNode node={child} depth={depth + 1} />
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-wrap justify-center gap-4">
						{node.comps.map((child, i) => (
							<div key={i} className="flex flex-col items-center">
								<TreeNode node={child} depth={depth + 1} />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
