import type { RadicalNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
	node: RadicalNode;
	isRoot?: boolean;
}

export function RadicalTree({ node, isRoot = false }: Props) {
	const hasChildren = node.children && node.children.length > 0;
	const childCount = node.children?.length ?? 0;

	return (
		<div className="flex flex-col items-center">
			{/* Node card */}
			<div
				className={cn(
					"relative z-10 shrink-0 rounded-xl px-4 py-2.5 text-center",
					isRoot
						? "border-2 border-primary bg-primary/5 shadow-sm"
						: "border border-border bg-card shadow-xs",
				)}
			>
				<div className="font-kai text-xl leading-none">{node.char}</div>
				<div className="mt-0.5 text-xs text-muted-foreground leading-tight">
					{node.pinyin}
				</div>
				<div className="text-xs font-medium leading-tight">{node.meaning}</div>
				{node.role && (
					<div className="mt-0.5 text-[10px] italic text-muted-foreground leading-tight max-w-16">
						{node.role}
					</div>
				)}
			</div>

			{/* Children */}
			{hasChildren && (
				<>
					{/* Vertical stem from card center */}
					<div className="h-4 w-px bg-border shrink-0" />

					{childCount === 1 ? (
						/* Single child: direct vertical connection */
						<RadicalTree node={node.children[0]} />
					) : (
						/* Multiple children: grid layout with horizontal rail */
						<div
							className="relative grid justify-items-center"
							style={{
								gridTemplateColumns: `repeat(${childCount}, 1fr)`,
							}}
						>
							{/* Horizontal rail spanning children */}
							<div
								className="absolute top-0 h-px bg-border pointer-events-none"
								style={{
									left: `calc(50% / ${childCount})`,
									right: `calc(50% / ${childCount})`,
								}}
							/>

							{node.children.map((child, i) => (
								<div
									key={i}
									className="px-3 flex flex-col items-center relative"
								>
									{/* Vertical drop from rail to child */}
									<div className="h-4 w-px bg-border shrink-0" />
									<RadicalTree node={child} />
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
