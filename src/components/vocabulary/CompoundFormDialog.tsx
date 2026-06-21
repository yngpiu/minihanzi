import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
	VocabCompound,
	VocabExample,
} from "@/lib/supabase/vocabulary-custom";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (compounds: VocabCompound[]) => Promise<void>;
	existingCompounds: VocabCompound[];
}

function emptyExample(): VocabExample {
	return { hanzi: "", pinyin: "", meaning: "" };
}

function emptyCompound(): VocabCompound {
	return { hanzi: "", pinyin: "", meaning: "", examples: [emptyExample()] };
}

export function CompoundFormDialog({
	open,
	onOpenChange,
	onSave,
	existingCompounds,
}: Props) {
	const [compounds, setCompounds] = useState<VocabCompound[]>([]);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setCompounds(
				existingCompounds.length > 0
					? existingCompounds.map((c) => ({
							...c,
							examples: c.examples.length > 0 ? c.examples : [emptyExample()],
						}))
					: [emptyCompound()],
			);
		}
	}, [open, existingCompounds]);

	function addCompound() {
		setCompounds((prev) => [...prev, emptyCompound()]);
	}

	function removeCompound(idx: number) {
		setCompounds((prev) => prev.filter((_, i) => i !== idx));
	}

	function updateCompound(
		idx: number,
		field: keyof VocabCompound,
		value: string,
	) {
		setCompounds((prev) =>
			prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
		);
	}

	function addExample(cIdx: number) {
		setCompounds((prev) =>
			prev.map((c, i) =>
				i === cIdx ? { ...c, examples: [...c.examples, emptyExample()] } : c,
			),
		);
	}

	function removeExample(cIdx: number, eIdx: number) {
		setCompounds((prev) =>
			prev.map((c, i) =>
				i === cIdx
					? {
							...c,
							examples: c.examples.filter((_, ei) => ei !== eIdx),
						}
					: c,
			),
		);
	}

	function updateExample(
		cIdx: number,
		eIdx: number,
		field: keyof VocabExample,
		value: string,
	) {
		setCompounds((prev) =>
			prev.map((c, i) =>
				i === cIdx
					? {
							...c,
							examples: c.examples.map((ex, ei) =>
								ei === eIdx ? { ...ex, [field]: value } : ex,
							),
						}
					: c,
			),
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			const valid = compounds.filter((c) => c.hanzi.trim());
			await onSave(valid);
			onOpenChange(false);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Quản lý từ ghép</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={handleSubmit}
					className="space-y-4 overflow-y-auto pr-1"
				>
					{compounds.map((comp, ci) => (
						<div key={ci} className="rounded-lg border p-3 space-y-3 relative">
							{compounds.length > 1 && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-destructive"
									onClick={() => removeCompound(ci)}
								>
									<Trash2 className="size-3.5" />
								</Button>
							)}

							<div className="grid grid-cols-3 gap-2">
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">
										Từ ghép {ci + 1}
									</Label>
									<Input
										value={comp.hanzi}
										onChange={(e) =>
											updateCompound(ci, "hanzi", e.target.value)
										}
										placeholder="vd: 好吃"
										className="font-kai"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">
										Pinyin
									</Label>
									<Input
										value={comp.pinyin}
										onChange={(e) =>
											updateCompound(ci, "pinyin", e.target.value)
										}
										placeholder="vh: hǎo chī"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">Nghĩa</Label>
									<Input
										value={comp.meaning}
										onChange={(e) =>
											updateCompound(ci, "meaning", e.target.value)
										}
										placeholder="vd: ngon"
									/>
								</div>
							</div>

							<div className="space-y-2 border-t pt-2">
								<div className="flex items-center justify-between">
									<Label className="text-xs text-muted-foreground">Ví dụ</Label>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => addExample(ci)}
										className="h-7 text-xs"
									>
										<Plus className="size-3 mr-1" />
										Thêm ví dụ
									</Button>
								</div>

								{comp.examples.map((ex, ei) => (
									<div key={ei} className="flex items-start gap-2">
										<div className="grid grid-cols-3 gap-2 flex-1">
											<Input
												value={ex.hanzi}
												onChange={(e) =>
													updateExample(ci, ei, "hanzi", e.target.value)
												}
												placeholder="Câu Hán"
												className="font-kai text-sm"
											/>
											<Input
												value={ex.pinyin}
												onChange={(e) =>
													updateExample(ci, ei, "pinyin", e.target.value)
												}
												placeholder="Pinyin"
												className="text-sm"
											/>
											<Input
												value={ex.meaning}
												onChange={(e) =>
													updateExample(ci, ei, "meaning", e.target.value)
												}
												placeholder="Nghĩa"
												className="text-sm"
											/>
										</div>
										{comp.examples.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
												onClick={() => removeExample(ci, ei)}
											>
												<Trash2 className="size-3.5" />
											</Button>
										)}
									</div>
								))}
							</div>
						</div>
					))}

					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addCompound}
						className="w-full"
					>
						<Plus className="size-4 mr-1" />
						Thêm từ ghép
					</Button>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Huỷ
						</Button>
						<Button type="submit" disabled={submitting}>
							Lưu
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
