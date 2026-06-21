import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { lookupCharacter } from "@/lib/dictionary-parser";
import type {
	VocabEntry,
	VocabExample,
	VocabMeaning,
} from "@/lib/supabase/vocabulary-custom";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: {
		hanzi: string;
		pinyin: string;
		meanings: VocabMeaning[];
	}) => Promise<void>;
	entry?: VocabEntry;
}

function emptyExample(): VocabExample {
	return { hanzi: "", pinyin: "", meaning: "" };
}

function emptyMeaning(): VocabMeaning {
	return { meaning: "", example: emptyExample() };
}

export function WordFormDialog({ open, onOpenChange, onSubmit, entry }: Props) {
	const [hanzi, setHanzi] = useState("");
	const [pinyin, setPinyin] = useState("");
	const [meanings, setMeanings] = useState<VocabMeaning[]>([emptyMeaning()]);
	const [dictLoading, setDictLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [charInfo, setCharInfo] = useState<{
		pinyin: string[];
		radical?: string;
		decomposition?: string;
	} | null>(null);

	useEffect(() => {
		if (!open) return;
		if (entry) {
			setHanzi(entry.hanzi);
			setPinyin(entry.pinyin);
			setMeanings(
				entry.meanings.length > 0
					? entry.meanings.map((m) => ({
							meaning: m.meaning,
							example: m.example ?? emptyExample(),
						}))
					: [emptyMeaning()],
			);
			setCharInfo(null);
		} else {
			setHanzi("");
			setPinyin("");
			setMeanings([emptyMeaning()]);
			setCharInfo(null);
		}
	}, [open, entry]);

	useEffect(() => {
		if (!hanzi || hanzi.length > 1) {
			setCharInfo(null);
			return;
		}
		let cancelled = false;
		setDictLoading(true);
		lookupCharacter(hanzi).then((info) => {
			if (cancelled) return;
			setCharInfo(
				info
					? {
							pinyin: info.pinyin,
							radical: info.radical,
							decomposition: info.decomposition,
						}
					: null,
			);
			if (info?.pinyin?.length && !pinyin) {
				setPinyin(info.pinyin.join(", "));
			}
			setDictLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [hanzi, pinyin]);

	function addMeaning() {
		setMeanings((prev) => [...prev, emptyMeaning()]);
	}

	function removeMeaning(idx: number) {
		setMeanings((prev) => prev.filter((_, i) => i !== idx));
	}

	function updateMeaning(idx: number, value: string) {
		setMeanings((prev) =>
			prev.map((m, i) => (i === idx ? { ...m, meaning: value } : m)),
		);
	}

	function updateExample(
		meaningIdx: number,
		field: keyof VocabExample,
		value: string,
	) {
		setMeanings((prev) =>
			prev.map((m, i) =>
				i === meaningIdx
					? { ...m, example: { ...m.example, [field]: value } }
					: m,
			),
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!hanzi.trim() || !pinyin.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit({
				hanzi: hanzi.trim(),
				pinyin: pinyin.trim(),
				meanings: meanings.filter((m) => m.meaning.trim()),
			});
			onOpenChange(false);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
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
								{dictLoading && (
									<Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
								)}
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

					{charInfo && (
						<div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
							{charInfo.pinyin.length > 0 && (
								<p>
									<span className="font-medium text-muted-foreground">
										Pinyin:
									</span>{" "}
									{charInfo.pinyin.join(", ")}
								</p>
							)}
							{charInfo.radical && (
								<p>
									<span className="font-medium text-muted-foreground">
										Bộ thủ:
									</span>{" "}
									{charInfo.radical}
								</p>
							)}
							{charInfo.decomposition && (
								<p>
									<span className="font-medium text-muted-foreground">
										Cấu trúc:
									</span>{" "}
									{charInfo.decomposition}
								</p>
							)}
						</div>
					)}

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-base">Nghĩa</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addMeaning}
							>
								<Plus className="size-3.5 mr-1" />
								Thêm nghĩa
							</Button>
						</div>

						{meanings.map((m, mi) => (
							<div
								key={mi}
								className="rounded-lg border p-3 space-y-3 relative"
							>
								{meanings.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-destructive"
										onClick={() => removeMeaning(mi)}
									>
										<Trash2 className="size-3.5" />
									</Button>
								)}

								<div className="space-y-2">
									<Label className="text-xs text-muted-foreground">
										Nghĩa {mi + 1}
									</Label>
									<Input
										value={m.meaning}
										onChange={(e) => updateMeaning(mi, e.target.value)}
										placeholder="vd: tốt, lành"
									/>
								</div>

								<div className="space-y-2 border-t pt-2">
									<Label className="text-xs text-muted-foreground">Ví dụ</Label>
									<div className="grid grid-cols-3 gap-2">
										<Input
											value={m.example.hanzi}
											onChange={(e) =>
												updateExample(mi, "hanzi", e.target.value)
											}
											placeholder="Câu Hán"
											className="font-kai"
										/>
										<Input
											value={m.example.pinyin}
											onChange={(e) =>
												updateExample(mi, "pinyin", e.target.value)
											}
											placeholder="Pinyin"
										/>
										<Input
											value={m.example.meaning}
											onChange={(e) =>
												updateExample(mi, "meaning", e.target.value)
											}
											placeholder="Nghĩa"
										/>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="flex justify-end gap-2">
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
