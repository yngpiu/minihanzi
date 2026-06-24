import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	KindGroup,
	MeanItem,
	VocabExample,
} from "@/lib/supabase/vocabulary-custom";

const KIND_OPTIONS = [
	"Tính từ",
	"Danh từ",
	"Động từ",
	"Phó từ",
	"Giới từ",
	"Liên từ",
	"Đại từ",
	"Số từ",
	"Lượng từ",
	"Trợ từ",
	"Thán từ",
	"Định từ",
	"Trợ động từ",
];

function emptyExample(): VocabExample {
	return { hanzi: "", pinyin: "", meaning: "" };
}

function emptyMean(): MeanItem {
	return { meaning: "", examples: [emptyExample()] };
}

function emptyKindGroup(): KindGroup {
	return { kind: "", means: [emptyMean()] };
}

interface Props {
	kindGroups: KindGroup[];
	onChange: (groups: KindGroup[]) => void;
}

export function KindGroupSection({ kindGroups, onChange }: Props) {
	const groups = kindGroups ?? [];

	function meansOf(g: KindGroup): MeanItem[] {
		return g.means ?? [];
	}

	function examplesOf(m: MeanItem): VocabExample[] {
		return m.examples ?? [];
	}

	function addKindGroup() {
		onChange([...groups, emptyKindGroup()]);
	}

	function removeKindGroup(gi: number) {
		onChange(groups.filter((_, i) => i !== gi));
	}

	function updateKind(gi: number, kind: string) {
		onChange(groups.map((g, i) => (i === gi ? { ...g, kind } : g)));
	}

	function addMean(gi: number) {
		onChange(
			groups.map((g, i) =>
				i === gi ? { ...g, means: [...meansOf(g), emptyMean()] } : g,
			),
		);
	}

	function removeMean(gi: number, mi: number) {
		onChange(
			groups.map((g, i) =>
				i === gi ? { ...g, means: meansOf(g).filter((_, j) => j !== mi) } : g,
			),
		);
	}

	function updateMean(gi: number, mi: number, meaning: string) {
		onChange(
			groups.map((g, i) =>
				i === gi
					? {
							...g,
							means: meansOf(g).map((m, j) =>
								j === mi ? { ...m, meaning } : m,
							),
						}
					: g,
			),
		);
	}

	function addExample(gi: number, mi: number) {
		onChange(
			groups.map((g, i) =>
				i === gi
					? {
							...g,
							means: meansOf(g).map((m, j) =>
								j === mi
									? { ...m, examples: [...examplesOf(m), emptyExample()] }
									: m,
							),
						}
					: g,
			),
		);
	}

	function removeExample(gi: number, mi: number, ei: number) {
		onChange(
			groups.map((g, i) =>
				i === gi
					? {
							...g,
							means: meansOf(g).map((m, j) =>
								j === mi
									? {
											...m,
											examples: examplesOf(m).filter((_, k) => k !== ei),
										}
									: m,
							),
						}
					: g,
			),
		);
	}

	function updateExample(
		gi: number,
		mi: number,
		ei: number,
		field: keyof VocabExample,
		value: string,
	) {
		onChange(
			groups.map((g, i) =>
				i === gi
					? {
							...g,
							means: meansOf(g).map((m, j) =>
								j === mi
									? {
											...m,
											examples: examplesOf(m).map((ex, k) =>
												k === ei ? { ...ex, [field]: value } : ex,
											),
										}
									: m,
							),
						}
					: g,
			),
		);
	}

	return (
		<div className="space-y-4">
			{groups.map((g, gi) => {
				const gMeans = meansOf(g);
				return (
					<div
						key={gi}
						className="rounded-xl border bg-card p-4 space-y-4 relative"
					>
						{groups.length > 1 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-destructive"
								onClick={() => removeKindGroup(gi)}
							>
								<Trash2 className="size-3.5" />
							</Button>
						)}

						{/* Kind selector */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Loại từ</Label>
							<Select value={g.kind} onValueChange={(v) => updateKind(gi, v)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Chọn loại từ..." />
								</SelectTrigger>
								<SelectContent>
									{KIND_OPTIONS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Means */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">Nghĩa</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									onClick={() => addMean(gi)}
								>
									<Plus className="size-3 mr-1" />
									Thêm nghĩa
								</Button>
							</div>

							{gMeans.map((m, mi) => {
								const mExamples = examplesOf(m);
								return (
									<div
										key={mi}
										className="rounded-lg border bg-muted/20 p-3 space-y-3 relative"
									>
										{gMeans.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute top-2 right-2 size-6 text-muted-foreground hover:text-destructive"
												onClick={() => removeMean(gi, mi)}
											>
												<Trash2 className="size-3" />
											</Button>
										)}

										<div className="space-y-1.5">
											<Label className="text-xs text-muted-foreground">
												Nghĩa {mi + 1}
											</Label>
											<Input
												value={m.meaning}
												onChange={(e) => updateMean(gi, mi, e.target.value)}
												placeholder="vd: ổn, hay, tốt, lành"
											/>
										</div>

										{/* Examples */}
										<div className="space-y-2 border-t pt-2">
											<div className="flex items-center justify-between">
												<Label className="text-xs text-muted-foreground">
													Ví dụ
												</Label>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-7 text-xs"
													onClick={() => addExample(gi, mi)}
												>
													<Plus className="size-3 mr-1" />
													Thêm ví dụ
												</Button>
											</div>

											{mExamples.map((ex, ei) => (
												<div
													key={ei}
													className="flex items-start gap-2 rounded-md bg-background p-2"
												>
													<div className="grid grid-cols-3 gap-2 flex-1">
														<Input
															value={ex.hanzi}
															onChange={(e) =>
																updateExample(
																	gi,
																	mi,
																	ei,
																	"hanzi",
																	e.target.value,
																)
															}
															placeholder="Câu Hán"
															className="font-kai text-sm h-8"
														/>
														<Input
															value={ex.pinyin}
															onChange={(e) =>
																updateExample(
																	gi,
																	mi,
																	ei,
																	"pinyin",
																	e.target.value,
																)
															}
															placeholder="Pinyin"
															className="text-sm h-8"
														/>
														<Input
															value={ex.meaning}
															onChange={(e) =>
																updateExample(
																	gi,
																	mi,
																	ei,
																	"meaning",
																	e.target.value,
																)
															}
															placeholder="Nghĩa"
															className="text-sm h-8"
														/>
													</div>
													{mExamples.length > 1 && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
															onClick={() => removeExample(gi, mi, ei)}
														>
															<Trash2 className="size-3" />
														</Button>
													)}
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={addKindGroup}
				className="w-full"
			>
				<Plus className="size-4 mr-1" />
				Thêm nhóm loại từ
			</Button>
		</div>
	);
}
