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
	KindGroup,
	VocabCompound,
} from "@/lib/supabase/vocabulary-custom";
import { KindGroupSection } from "./KindGroupSection";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (compounds: VocabCompound[]) => Promise<void>;
	existingCompounds: VocabCompound[];
}

function emptyCompound(): VocabCompound {
	return { hanzi: "", pinyin: "", kind_groups: [] };
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
			const compounds = existingCompounds ?? [];
			setCompounds(
				compounds.length > 0
					? compounds.map((c) => ({
							hanzi: c.hanzi,
							pinyin: c.pinyin,
							kind_groups:
								c.kind_groups && c.kind_groups.length > 0 ? c.kind_groups : [],
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
		field: "hanzi" | "pinyin",
		value: string,
	) {
		setCompounds((prev) =>
			prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
		);
	}

	function updateKindGroups(idx: number, kind_groups: KindGroup[]) {
		setCompounds((prev) =>
			prev.map((c, i) => (i === idx ? { ...c, kind_groups } : c)),
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			const valid = compounds
				.filter((c) => c.hanzi.trim())
				.map((c) => ({
					...c,
					kind_groups: c.kind_groups
						.map((g) => ({
							...g,
							means: g.means
								.filter((m) => m.meaning.trim())
								.map((m) => ({
									...m,
									examples: m.examples.filter(
										(ex) => ex.hanzi.trim() || ex.meaning.trim(),
									),
								})),
						}))
						.filter((g) => g.means.length > 0),
				}));
			await onSave(valid);
			onOpenChange(false);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Quản lý từ ghép</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					{compounds.map((comp, ci) => (
						<div
							key={ci}
							className="rounded-xl border bg-card p-4 space-y-4 relative"
						>
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

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">
										Từ ghép {ci + 1}
									</Label>
									<Input
										value={comp.hanzi}
										onChange={(e) =>
											updateCompound(ci, "hanzi", e.target.value)
										}
										placeholder="vd: 友好"
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
										placeholder="vd: yǒuhǎo"
									/>
								</div>
							</div>

							<KindGroupSection
								kindGroups={comp.kind_groups}
								onChange={(groups) => updateKindGroups(ci, groups)}
							/>
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

					<div className="flex justify-end gap-2 pt-2 border-t">
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
