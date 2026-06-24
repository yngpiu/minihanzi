import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { VocabEntry } from "@/lib/supabase/vocabulary-custom";
import { translateKind } from "@/services/utils";

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
	const kindGroups = entry.kind_groups ?? [];
	const compounds = entry.compounds ?? [];
	const hasCompounds = compounds.length > 0;
	const hasKindGroups = kindGroups.length > 0;

	return (
		<div className="py-4">
			<div className="flex items-start gap-4">
				<div className="flex-1 min-w-0 space-y-2">
					<div className="flex items-baseline gap-3">
						<h3 className="font-kai text-4xl tracking-wider leading-none">
							{entry.hanzi}
						</h3>
						<span className="text-base text-muted-foreground">
							{entry.pinyin}
						</span>
					</div>

					{hasKindGroups && (
						<div className="space-y-2">
							{kindGroups.map((g, gi) => {
								const means = g.means ?? [];
								return (
									<div key={gi} className="space-y-1">
										{g.kind && (
											<Badge
												variant="outline"
												className="text-[10px] px-1.5 py-0"
											>
												{translateKind(g.kind)}
											</Badge>
										)}
										<div className="text-sm text-muted-foreground">
											{means.map((m) => m.meaning).join(" · ")}
										</div>
										{means
											.filter((m) => (m.examples ?? []).some((ex) => ex.hanzi))
											.slice(0, 2)
											.map((m, mi) =>
												(m.examples ?? [])
													.filter((ex) => ex.hanzi)
													.slice(0, 1)
													.map((ex, ei) => (
														<div
															key={`${mi}-${ei}`}
															className="text-xs text-muted-foreground/60 space-y-0.5 mt-1"
														>
															<p className="font-kai">{ex.hanzi}</p>
															<p>{ex.pinyin}</p>
														</div>
													)),
											)}
									</div>
								);
							})}
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
						{compounds.length} từ ghép
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

			{open && hasCompounds && (
				<div className="mt-3 pl-5 space-y-4">
					{compounds.map((comp, ci) => {
						const compKindGroups = comp.kind_groups ?? [];
						const hasCKg = compKindGroups.length > 0;
						return (
							<div key={ci} className="space-y-2">
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
									</div>
									<button
										type="button"
										onClick={() => onManageCompounds(entry)}
										className="p-1.5 rounded-md hover:bg-muted text-muted-foreground shrink-0"
									>
										<Edit className="size-4" />
									</button>
								</div>

								{hasCKg && (
									<div className="ml-4 pl-4 border-l-2 border-muted space-y-2">
										{compKindGroups.map((g, gi) => {
											const gMeans = g.means ?? [];
											return (
												<div key={gi} className="space-y-1">
													{g.kind && (
														<Badge
															variant="outline"
															className="text-[10px] px-1.5 py-0"
														>
															{translateKind(g.kind)}
														</Badge>
													)}
													{gMeans
														.filter((m) =>
															(m.examples ?? []).some((ex) => ex.hanzi),
														)
														.map((m, mi) =>
															(m.examples ?? [])
																.filter((ex) => ex.hanzi)
																.slice(0, 2)
																.map((ex, ei) => (
																	<div
																		key={`${mi}-${ei}`}
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
																)),
														)}
												</div>
											);
										})}
									</div>
								)}

								<button
									type="button"
									onClick={() => onManageCompounds(entry)}
									className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									<Plus className="size-4" />
									Thêm từ ghép
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
