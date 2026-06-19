import {
	BookOpen,
	ImageIcon,
	PenLine,
	Save,
	TreePine,
	Volume2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { KanjiTile } from "@/components/word-entry/KanjiTile";
import { useUpdateWord } from "@/hooks/queries";
import { getMasteryInfo, reviewToMasteryLevel } from "@/lib/fsrs";
import { uploadWordImage } from "@/lib/supabase/storage";
import type { ExampleData, WordWithReview } from "@/lib/types";
import { ExampleDisplay } from "./ExampleDisplay";
import { RadicalTree } from "./RadicalTree";

interface Props {
	word: WordWithReview | null;
	open: boolean;
	editMode?: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WordDetailDialog({
	word,
	open,
	editMode,
	onOpenChange,
}: Props) {
	const [editing, setEditing] = useState(false);
	const [initialEdit, setInitialEdit] = useState(false);
	const [playing, setPlaying] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [removeImage, setRemoveImage] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [editHanzi, setEditHanzi] = useState("");
	const [editPinyin, setEditPinyin] = useState("");
	const [editMeaning, setEditMeaning] = useState("");
	const [editEtymology, setEditEtymology] = useState("");
	const [editExampleHanzi, setEditExampleHanzi] = useState("");
	const [editExamplePinyin, setEditExamplePinyin] = useState("");
	const [editExampleMeaning, setEditExampleMeaning] = useState("");

	const { mutate: updateWord, isPending } = useUpdateWord();

	useEffect(() => {
		if (open && editMode && !initialEdit) {
			setEditing(true);
			setInitialEdit(true);
		}
		if (!open) {
			setEditing(false);
			setInitialEdit(false);
		}
	}, [open, editMode, initialEdit]);

	useEffect(() => {
		if ((editing || editMode) && word) {
			setEditHanzi(word.hanzi);
			setEditPinyin(word.pinyin);
			setEditMeaning(word.meaning);
			setEditEtymology(word.etymology ?? "");
			setEditExampleHanzi(word.example_data?.hanzi ?? "");
			setEditExamplePinyin(word.example_data?.pinyin ?? "");
			setEditExampleMeaning(word.example_data?.meaning ?? "");
			setImageFile(null);
			setImagePreview(null);
			setRemoveImage(false);
		}
	}, [editing, editMode, word]);

	const speak = useCallback(() => {
		if (playing || !word) return;
		if (!window.speechSynthesis) return;
		setPlaying(true);
		const u = new SpeechSynthesisUtterance(word.hanzi);
		u.lang = "zh-CN";
		u.rate = 0.9;
		u.onend = () => setPlaying(false);
		u.onerror = () => setPlaying(false);
		window.speechSynthesis.speak(u);
	}, [word, playing]);

	function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setRemoveImage(false);
	}

	if (!word) return null;

	const review = word.word_review;
	const level = reviewToMasteryLevel(review);
	const info = getMasteryInfo(level);
	const nextReview = review?.next_review_at;
	const isOverdue = nextReview && new Date(nextReview) <= new Date();

	const chars = [...new Set(word.hanzi.split(""))];

	async function handleSave() {
		if (!word) return;
		const exampleData: ExampleData | undefined =
			editExampleHanzi.trim() ||
			editExamplePinyin.trim() ||
			editExampleMeaning.trim()
				? {
						hanzi: editExampleHanzi.trim(),
						pinyin: editExamplePinyin.trim(),
						meaning: editExampleMeaning.trim(),
					}
				: undefined;

		let image_url: string | null | undefined;
		if (imageFile) {
			image_url = await uploadWordImage(imageFile, word.id);
		} else if (removeImage) {
			image_url = null;
		} else {
			image_url = undefined;
		}

		updateWord(
			{
				id: word.id,
				fields: {
					hanzi: editHanzi.trim(),
					pinyin: editPinyin.trim(),
					meaning: editMeaning.trim(),
					etymology: editEtymology.trim() || null,
					example_data: exampleData ?? null,
					image_url,
				},
			},
			{
				onSuccess: () => {
					setEditing(false);
					setImageFile(null);
					setImagePreview(null);
					setRemoveImage(false);
				},
			},
		);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				onOpenChange(v);
				if (!v) {
					setEditing(false);
					setImageFile(null);
					setImagePreview(null);
					setRemoveImage(false);
				}
			}}
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>
						{editing ? "Chỉnh sửa từ vựng" : "Chi tiết từ vựng"}
					</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue="meaning">
					<TabsList>
						<TabsTrigger value="meaning">
							<BookOpen data-icon="inline-start" />
							Nghĩa
						</TabsTrigger>
						<TabsTrigger value="radical">
							<TreePine data-icon="inline-start" />
							Bộ thủ
						</TabsTrigger>
						<TabsTrigger value="writing">
							<PenLine data-icon="inline-start" />
							Luyện viết
						</TabsTrigger>
					</TabsList>

					{/* Tab 1: Nghĩa */}
					<TabsContent value="meaning" className="mt-4 space-y-4">
						{editing ? (
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="edit-hanzi">Chữ Hán</FieldLabel>
									<Input
										id="edit-hanzi"
										value={editHanzi}
										onChange={(e) => setEditHanzi(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="edit-pinyin">Pinyin</FieldLabel>
									<Input
										id="edit-pinyin"
										value={editPinyin}
										onChange={(e) => setEditPinyin(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="edit-meaning">Nghĩa</FieldLabel>
									<Input
										id="edit-meaning"
										value={editMeaning}
										onChange={(e) => setEditMeaning(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="edit-etymology">Chiết tự</FieldLabel>
									<Textarea
										id="edit-etymology"
										value={editEtymology}
										onChange={(e) => setEditEtymology(e.target.value)}
										rows={3}
									/>
								</Field>

								<div className="space-y-2">
									<p className="text-xs text-muted-foreground font-medium">
										Ví dụ
									</p>
									<Field>
										<FieldLabel htmlFor="edit-example-hanzi">
											Chữ Hán
										</FieldLabel>
										<Input
											id="edit-example-hanzi"
											value={editExampleHanzi}
											onChange={(e) => setEditExampleHanzi(e.target.value)}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="edit-example-pinyin">
											Pinyin
										</FieldLabel>
										<Input
											id="edit-example-pinyin"
											value={editExamplePinyin}
											onChange={(e) => setEditExamplePinyin(e.target.value)}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="edit-example-meaning">
											Nghĩa
										</FieldLabel>
										<Input
											id="edit-example-meaning"
											value={editExampleMeaning}
											onChange={(e) => setEditExampleMeaning(e.target.value)}
										/>
									</Field>
								</div>

								<div className="space-y-2">
									<p className="text-xs text-muted-foreground font-medium">
										Ảnh minh hoạ
									</p>
									{imagePreview || (word.image_url && !removeImage) ? (
										<div className="relative inline-block">
											<img
												src={imagePreview ?? word.image_url ?? ""}
												alt={word.hanzi}
												className="h-24 w-24 rounded-lg object-cover border"
											/>
											<button
												type="button"
												onClick={() => {
													setImageFile(null);
													setImagePreview(null);
													setRemoveImage(true);
												}}
												className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
											>
												<X size={14} />
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
										>
											<ImageIcon size={16} />
											Chọn ảnh
										</button>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/png,image/jpeg,image/webp,image/gif"
										className="hidden"
										onChange={handleImageSelect}
									/>
								</div>

								<div className="flex justify-end gap-2 pt-2">
									<Button
										type="button"
										onClick={handleSave}
										disabled={isPending}
									>
										<Save />
										Lưu
									</Button>
								</div>
							</FieldGroup>
						) : (
							<>
								<div className="flex flex-col items-center gap-3">
									<div className="flex items-center gap-3">
										<p className="text-5xl font-kai select-none">
											{word.hanzi}
										</p>
										<button
											type="button"
											onClick={speak}
											className={`flex items-center justify-center size-10 rounded-full border transition-colors ${
												playing
													? "border-primary bg-primary/10 text-primary"
													: "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
											}`}
											title="Phát âm"
										>
											<Volume2
												size={18}
												className={playing ? "animate-pulse" : ""}
											/>
										</button>
									</div>

									<p className="text-lg text-muted-foreground">{word.pinyin}</p>
									<p className="text-base font-medium">{word.meaning}</p>

									<Badge variant={info.variant}>{info.label}</Badge>
								</div>

								<div className="w-full space-y-3 text-sm">
									{word.image_url && (
										<div className="flex justify-center">
											<img
												src={word.image_url}
												alt={word.hanzi}
												className="max-h-48 rounded-lg object-contain border"
											/>
										</div>
									)}

									{word.etymology && (
										<div className="space-y-1">
											<span className="text-muted-foreground text-xs font-medium">
												Chiết tự
											</span>
											<p className="text-muted-foreground">{word.etymology}</p>
										</div>
									)}

									{word.example_data ? (
										<div className="space-y-1">
											<span className="text-muted-foreground text-xs font-medium">
												Ví dụ
											</span>
											<div className="rounded-lg border bg-muted/30 p-3">
												<ExampleDisplay data={word.example_data} />
											</div>
										</div>
									) : word.example ? (
										<div className="flex gap-2">
											<span className="text-muted-foreground shrink-0 w-16">
												Ví dụ
											</span>
											<span className="italic">{word.example}</span>
										</div>
									) : null}

									{review && (
										<div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
											<div className="flex gap-2">
												<span className="shrink-0">Đã học</span>
												<span>{review.total_reviews} lần</span>
											</div>
											{nextReview && (
												<div className="flex gap-2">
													<span className="shrink-0">Ôn tiếp</span>
													<span
														className={
															isOverdue ? "text-destructive font-medium" : ""
														}
													>
														{new Date(nextReview).toLocaleDateString("vi-VN")}
														{isOverdue && " (quá hạn)"}
													</span>
												</div>
											)}
										</div>
									)}
								</div>
							</>
						)}
					</TabsContent>

					{/* Tab 2: Bộ thủ */}
					<TabsContent value="radical" className="mt-4 space-y-4">
						{word.radical_components && word.radical_components.length > 0 ? (
							<div className="overflow-x-auto pb-2">
								<RadicalTree
									node={{
										char: word.hanzi,
										pinyin: word.pinyin,
										meaning: word.meaning,
										role: "",
										children: word.radical_components,
									}}
									isRoot
								/>
							</div>
						) : word.radical ? (
							<div className="flex gap-2 text-sm">
								<span className="text-muted-foreground shrink-0">Bộ thủ:</span>
								<span>{word.radical}</span>
							</div>
						) : (
							<p className="text-sm text-muted-foreground italic">
								Không có dữ liệu bộ thủ.
							</p>
						)}

						{word.etymology && (
							<div className="border-t pt-3 space-y-1 text-sm">
								<span className="text-muted-foreground text-xs font-medium">
									Chiết tự
								</span>
								<p className="text-muted-foreground">{word.etymology}</p>
							</div>
						)}
					</TabsContent>

					{/* Tab 3: Luyện viết */}
					<TabsContent value="writing" className="mt-4">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
							{chars.map((ch) => (
								<KanjiTile key={ch} char={ch} />
							))}
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
