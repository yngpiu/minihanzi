import { Loader2 } from "lucide-react";
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
import type { KindGroup, VocabEntry } from "@/lib/supabase/vocabulary-custom";
import { CharInfoCard } from "./CharInfoCard";
import { KindGroupSection } from "./KindGroupSection";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: {
		hanzi: string;
		pinyin: string;
		kind_groups: KindGroup[];
	}) => Promise<void>;
	entry?: VocabEntry;
}

export function WordFormDialog({ open, onOpenChange, onSubmit, entry }: Props) {
	const [hanzi, setHanzi] = useState("");
	const [pinyin, setPinyin] = useState("");
	const [kindGroups, setKindGroups] = useState<KindGroup[]>([]);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (entry) {
			setHanzi(entry.hanzi);
			setPinyin(entry.pinyin);
			setKindGroups(
				entry.kind_groups && entry.kind_groups.length > 0
					? entry.kind_groups
					: [],
			);
		} else {
			setHanzi("");
			setPinyin("");
			setKindGroups([]);
		}
	}, [open, entry]);

	function handlePinyinDetected(p: string) {
		if (!pinyin) setPinyin(p);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!hanzi.trim() || !pinyin.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit({
				hanzi: hanzi.trim(),
				pinyin: pinyin.trim(),
				kind_groups: kindGroups
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
			});
			onOpenChange(false);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{entry ? "Sửa từ" : "Thêm từ mới"}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="hanzi">Chữ Hán</Label>
							<div className="relative">
								<Input
									id="hanzi"
									value={hanzi}
									onChange={(e) => setHanzi(e.target.value)}
									placeholder="vd: 好"
									className="font-kai text-lg"
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="pinyin">Pinyin</Label>
							<Input
								id="pinyin"
								value={pinyin}
								onChange={(e) => setPinyin(e.target.value)}
								placeholder="vd: hǎo"
								required
							/>
						</div>
					</div>

					<CharInfoCard hanzi={hanzi} onPinyinDetected={handlePinyinDetected} />

					<div className="space-y-3">
						<Label className="text-base font-medium">Nghĩa</Label>
						<KindGroupSection
							kindGroups={kindGroups}
							onChange={setKindGroups}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Huỷ
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting && <Loader2 className="size-4 mr-1 animate-spin" />}
							{entry ? "Lưu" : "Thêm"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
