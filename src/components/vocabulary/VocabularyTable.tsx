import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { VocabEntry } from "@/lib/supabase/vocabulary-custom";

interface Props {
	entries: VocabEntry[];
	onEdit: (entry: VocabEntry) => void;
	onDelete: (id: number) => void;
	onManageCompounds: (entry: VocabEntry) => void;
}

export function VocabularyTable({
	entries,
	onEdit,
	onDelete,
	onManageCompounds,
}: Props) {
	return (
		<div className="divide-y">
			{entries.map((entry) => (
				<VocabRow
					key={entry.id}
					entry={entry}
					onEdit={onEdit}
					onDelete={onDelete}
					onManageCompounds={onManageCompounds}
				/>
			))}
		</div>
	);
}

function VocabRow({
	entry,
	onEdit,
	onDelete,
	onManageCompounds,
}: Props & { entry: VocabEntry }) {
	const [open, setOpen] = useState(false);
	const hasCompounds = entry.compounds.length > 0;

	return (
		<div className="py-4">
			{/* Main row */}
			<div className="flex items-start gap-4">
				<div className="flex-1 min-w-0 space-y-1.5">
					<div className="flex items-baseline gap-3">
						<h3 className="font-kai text-4xl tracking-wider leading-none">
							{entry.hanzi}
						</h3>
						<span className="text-base text-muted-foreground">
							{entry.pinyin}
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						{entry.meanings.map((m) => m.meaning).join(" · ")}
					</p>
					{entry.meanings.some((m) => m.example?.hanzi) && (
						<div className="space-y-2 pt-1">
							{entry.meanings
								.filter((m) => m.example?.hanzi)
								.map((m, mi) => (
									<div
										key={mi}
										className="text-sm text-muted-foreground space-y-0.5"
									>
										<p className="font-kai">{m.example.hanzi}</p>
										<p>{m.example.pinyin}</p>
										{m.example.meaning && (
											<p className="text-muted-foreground/60">
												{m.example.meaning}
											</p>
										)}
									</div>
								))}
						</div>
					)}
				</div>
				<div className="flex items-center gap-1 shrink-0 pt-1">
					{!hasCompounds && (
						<button
							type="button"
							onClick={() => onManageCompounds(entry)}
							className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
						>
							<Plus className="size-4" />
						</button>
					)}
					<button
						type="button"
						onClick={() => onEdit(entry)}
						className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
					>
						<Edit className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => onDelete(entry.id)}
						className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="size-4" />
					</button>
				</div>
			</div>

			{/* Compounds toggle */}
			<div className="mt-3">
				{hasCompounds ? (
					<button
						type="button"
						onClick={() => setOpen(!open)}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						{open ? (
							<ChevronDown className="size-4" />
						) : (
							<ChevronRight className="size-4" />
						)}
						{entry.compounds.length} từ ghép
					</button>
				) : (
					<button
						type="button"
						onClick={() => onManageCompounds(entry)}
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<Plus className="size-4" />
						Thêm từ ghép
					</button>
				)}
			</div>

			{/* Expanded compounds */}
			{open && hasCompounds && (
				<div className="mt-3 pl-5 space-y-4">
					{entry.compounds.map((comp, ci) => (
						<div key={ci} className="space-y-1.5">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<div className="flex items-baseline gap-2.5">
										<span className="font-kai text-xl tracking-wider">
											{comp.hanzi}
										</span>
										<span className="text-sm text-muted-foreground">
											{comp.pinyin}
										</span>
									</div>
									<p className="text-sm text-muted-foreground/70">
										{comp.meaning}
									</p>
								</div>
								<button
									type="button"
									onClick={() => onManageCompounds(entry)}
									className="p-1.5 rounded-md hover:bg-muted text-muted-foreground shrink-0"
								>
									<Edit className="size-4" />
								</button>
							</div>

							{comp.examples.filter((ex) => ex.hanzi).length > 0 && (
								<div className="ml-4 pl-4 border-l-2 border-muted space-y-2">
									{comp.examples
										.filter((ex) => ex.hanzi)
										.map((ex, ei) => (
											<div
												key={ei}
												className="text-sm text-muted-foreground space-y-0.5"
											>
												<p className="font-kai">{ex.hanzi}</p>
												<p>{ex.pinyin}</p>
												{ex.meaning && (
													<p className="text-muted-foreground/60">
														{ex.meaning}
													</p>
												)}
											</div>
										))}
								</div>
							)}
						</div>
					))}

					<button
						type="button"
						onClick={() => onManageCompounds(entry)}
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<Plus className="size-4" />
						Thêm từ ghép
					</button>
				</div>
			)}
		</div>
	);
}
