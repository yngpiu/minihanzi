import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAddWord, useAIEnrich } from "@/hooks/queries";
import type { ExampleData, RadicalNode } from "@/lib/types";
import { ExampleDisplay } from "./ExampleDisplay";
import { RadicalTree } from "./RadicalTree";

export function AIAddWordDialog() {
	const [open, setOpen] = useState(false);
	const [hanzi, setHanzi] = useState("");
	const [editMode, setEditMode] = useState(false);

	const [pinyin, setPinyin] = useState("");
	const [meaning, setMeaning] = useState("");
	const [radicalComponents, setRadicalComponents] = useState<RadicalNode[]>([]);
	const [etymology, setEtymology] = useState("");
	const [exampleData, setExampleData] = useState<ExampleData | null>(null);

	const aiQuery = useAIEnrich(editMode ? hanzi : "");
	const { mutate: addWord, isPending } = useAddWord();

	function handleLookup() {
		if (!hanzi.trim()) return;
		setEditMode(true);
	}

	function handleReset() {
		setHanzi("");
		setPinyin("");
		setMeaning("");
		setRadicalComponents([]);
		setEtymology("");
		setExampleData(null);
		setEditMode(false);
	}

	const result = aiQuery.data;
	if (editMode && result && !pinyin) {
		setPinyin(result.pinyin ?? "");
		setMeaning(result.meaning ?? "");
		setRadicalComponents(result.radical_components ?? []);
		setEtymology(result.etymology ?? "");
		setExampleData(result.example_data ?? null);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!hanzi.trim() || !pinyin.trim() || !meaning.trim()) return;
		addWord(
			{
				hanzi: hanzi.trim(),
				pinyin: pinyin.trim(),
				meaning: meaning.trim(),
				radical_components:
					radicalComponents.length > 0 ? radicalComponents : undefined,
				etymology: etymology.trim() || undefined,
				example_data: exampleData ?? undefined,
			},
			{
				onSuccess: () => {
					handleReset();
					setOpen(false);
				},
			},
		);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) handleReset();
			}}
		>
			<DialogTrigger asChild>
				<Button variant="secondary">
					<Sparkles data-icon="inline-start" />
					Nhập từ mới bằng AI
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{editMode ? "Kết quả từ AI" : "Nhập từ mới bằng AI"}
					</DialogTitle>
				</DialogHeader>

				{!editMode ? (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Nhập chữ Hán, AI sẽ tự động tra pinyin, nghĩa, bộ thủ, chiết tự và
							câu ví dụ.
						</p>
						<Field>
							<FieldLabel htmlFor="ai-hanzi">
								字 Chữ Hán <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="ai-hanzi"
								value={hanzi}
								onChange={(e) => setHanzi(e.target.value)}
								placeholder="Nhập chữ Hán..."
								autoComplete="off"
								autoFocus
							/>
						</Field>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setOpen(false)}>
								Huỷ
							</Button>
							<Button onClick={handleLookup} disabled={!hanzi.trim()}>
								<Sparkles data-icon="inline-start" />
								Tra cứu bằng AI
							</Button>
						</div>
					</div>
				) : aiQuery.isLoading ? (
					<div className="flex flex-col items-center gap-3 py-8">
						<Loader2 size={32} className="animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							Đang tra cứu với AI...
						</p>
					</div>
				) : aiQuery.isError ? (
					<div className="space-y-4">
						<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
							<p className="text-sm text-destructive">
								Không thể tra cứu từ này. Vui lòng thử lại.
							</p>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={handleReset}>
								Thử lại
							</Button>
							<Button
								onClick={() => aiQuery.refetch()}
								disabled={aiQuery.isFetching}
							>
								<Sparkles data-icon="inline-start" />
								Thử lại
							</Button>
						</div>
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="ai-result-hanzi">
									字 Chữ Hán <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="ai-result-hanzi"
									value={hanzi}
									onChange={(e) => setHanzi(e.target.value)}
									autoComplete="off"
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="ai-result-pinyin">
									Pinyin <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="ai-result-pinyin"
									value={pinyin}
									onChange={(e) => setPinyin(e.target.value)}
									autoComplete="off"
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="ai-result-meaning">
									Nghĩa <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="ai-result-meaning"
									value={meaning}
									onChange={(e) => setMeaning(e.target.value)}
									autoComplete="off"
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="ai-result-radical">
									Bộ thủ cấu tạo
								</FieldLabel>
								{radicalComponents.length > 0 ? (
									<div className="rounded-lg border bg-muted/30 p-3 overflow-x-auto">
										<RadicalTree
											node={{
												char: hanzi,
												pinyin,
												meaning,
												role: "",
												children: radicalComponents,
											}}
											isRoot
										/>
									</div>
								) : (
									<p className="text-xs text-muted-foreground italic">
										Không có dữ liệu
									</p>
								)}
							</Field>

							<Field>
								<FieldLabel htmlFor="ai-result-etymology">
									Câu chuyện chiết tự
								</FieldLabel>
								<Textarea
									id="ai-result-etymology"
									value={etymology}
									onChange={(e) => setEtymology(e.target.value)}
									placeholder="Ghi chú về cách nhớ mặt chữ..."
									rows={3}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="ai-result-example">Ví dụ</FieldLabel>
								{exampleData ? (
									<div className="rounded-lg border bg-muted/30 p-3">
										<ExampleDisplay data={exampleData} />
									</div>
								) : (
									<p className="text-xs text-muted-foreground italic">
										Không có dữ liệu
									</p>
								)}
							</Field>
						</FieldGroup>

						<div className="flex justify-end gap-2 pt-4">
							<Button type="button" variant="outline" onClick={handleReset}>
								Nhập lại
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending && <Loader2 className="animate-spin" />}
								Thêm vào kho
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
