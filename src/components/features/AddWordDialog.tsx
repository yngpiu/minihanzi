import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAddWord } from "@/hooks/queries";

export function AddWordDialog() {
	const [open, setOpen] = useState(false);
	const [hanzi, setHanzi] = useState("");
	const [pinyin, setPinyin] = useState("");
	const [meaning, setMeaning] = useState("");
	const [radical, setRadical] = useState("");
	const [etymology, setEtymology] = useState("");
	const [example, setExample] = useState("");

	const { mutate: addWord, isPending } = useAddWord();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!hanzi.trim() || !pinyin.trim() || !meaning.trim()) return;
		addWord(
			{
				hanzi: hanzi.trim(),
				pinyin: pinyin.trim(),
				meaning: meaning.trim(),
				radical: radical.trim() || undefined,
				etymology: etymology.trim() || undefined,
				example: example.trim() || undefined,
			},
			{
				onSuccess: () => {
					setHanzi("");
					setPinyin("");
					setMeaning("");
					setRadical("");
					setEtymology("");
					setExample("");
					setOpen(false);
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus size={16} />
					Thêm từ
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Thêm từ vựng mới</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="hanzi">
							字 Chữ Hán <span className="text-destructive">*</span>
						</label>
						<Input
							id="hanzi"
							value={hanzi}
							onChange={(e) => setHanzi(e.target.value)}
							placeholder="Nhập chữ Hán..."
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="pinyin">
							Pinyin <span className="text-destructive">*</span>
						</label>
						<Input
							id="pinyin"
							value={pinyin}
							onChange={(e) => setPinyin(e.target.value)}
							placeholder="Nhập pinyin..."
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="meaning">
							Nghĩa <span className="text-destructive">*</span>
						</label>
						<Input
							id="meaning"
							value={meaning}
							onChange={(e) => setMeaning(e.target.value)}
							placeholder="Nhập nghĩa tiếng Việt..."
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="radical">
							Bộ thủ cấu tạo
						</label>
						<Input
							id="radical"
							value={radical}
							onChange={(e) => setRadical(e.target.value)}
							placeholder="Ví dụ: 氵, 木, 口..."
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="etymology">
							Câu chuyện chiết tự
						</label>
						<Textarea
							id="etymology"
							value={etymology}
							onChange={(e) => setEtymology(e.target.value)}
							placeholder="Ghi chú về cách nhớ mặt chữ..."
							rows={3}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="example">
							Ví dụ
						</label>
						<Input
							id="example"
							value={example}
							onChange={(e) => setExample(e.target.value)}
							placeholder="Câu ví dụ..."
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Huỷ
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Loader2 size={14} className="animate-spin" />}
							Thêm vào kho
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
