import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, BookOpen, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CompoundFormDialog } from "@/components/vocabulary/CompoundFormDialog";
import { VocabularyTable } from "@/components/vocabulary/VocabularyTable";
import { WordFormDialog } from "@/components/vocabulary/WordFormDialog";
import {
	useCreateEntry,
	useDeleteEntry,
	useUpdateEntry,
	useVocabularyEntries,
} from "@/hooks/queries/useVocabularyCustom";
import type {
	VocabCompound,
	VocabEntry,
} from "@/lib/supabase/vocabulary-custom";

export const Route = createFileRoute("/vocabulary")({
	component: VocabularyPage,
});

function VocabularyPage() {
	const { data: entries, isLoading, error } = useVocabularyEntries();
	const createMutation = useCreateEntry();
	const updateMutation = useUpdateEntry();
	const deleteMutation = useDeleteEntry();

	const [wordDialogOpen, setWordDialogOpen] = useState(false);
	const [editingEntry, setEditingEntry] = useState<VocabEntry | undefined>();
	const [compoundDialogOpen, setCompoundDialogOpen] = useState(false);
	const [compoundTarget, setCompoundTarget] = useState<
		VocabEntry | undefined
	>();
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		if (!search.trim()) return entries ?? [];
		const q = search.toLowerCase();
		return (entries ?? []).filter(
			(e) =>
				e.hanzi.toLowerCase().includes(q) ||
				e.pinyin.toLowerCase().includes(q) ||
				(e.kind_groups ?? []).some((g) =>
					(g.means ?? []).some((m) => m.meaning.toLowerCase().includes(q)),
				),
		);
	}, [entries, search]);

	const compoundCount = useMemo(
		() => (entries ?? []).reduce((s, e) => s + e.compounds.length, 0),
		[entries],
	);

	function handleAdd() {
		setEditingEntry(undefined);
		setWordDialogOpen(true);
	}

	function handleEdit(entry: VocabEntry) {
		setEditingEntry(entry);
		setWordDialogOpen(true);
	}

	async function handleWordSubmit(data: {
		hanzi: string;
		pinyin: string;
		kind_groups: VocabEntry["kind_groups"];
	}) {
		if (editingEntry) {
			await updateMutation.mutateAsync({
				id: editingEntry.id,
				hanzi: data.hanzi,
				pinyin: data.pinyin,
				kind_groups: data.kind_groups,
			});
		} else {
			await createMutation.mutateAsync({
				hanzi: data.hanzi,
				pinyin: data.pinyin,
				kind_groups: data.kind_groups,
				compounds: [],
			});
		}
	}

	async function handleDelete(id: number) {
		if (!window.confirm("Xoá từ này?")) return;
		await deleteMutation.mutateAsync(id);
	}

	function handleManageCompounds(entry: VocabEntry) {
		setCompoundTarget(entry);
		setCompoundDialogOpen(true);
	}

	async function handleCompoundsSave(compounds: VocabCompound[]) {
		if (!compoundTarget) return;
		await updateMutation.mutateAsync({
			id: compoundTarget.id,
			compounds,
		});
	}

	return (
		<div className="mx-auto max-w-4xl px-4 md:px-0 py-6 space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Từ vựng của tôi</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Quản lý từ vựng cá nhân
					</p>
				</div>
				<Button onClick={handleAdd}>
					<Plus className="size-4 mr-2" />
					Thêm từ mới
				</Button>
			</div>

			{!isLoading && entries && entries.length > 0 && (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
					<span className="inline-flex items-center gap-1.5">
						<BookOpen className="size-4" />
						{entries.length} từ
					</span>
					{compoundCount > 0 && <span>{compoundCount} từ ghép</span>}
				</div>
			)}

			{!isLoading && entries && entries.length > 0 && (
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Tìm theo chữ Hán, pinyin hoặc nghĩa..."
						className="pl-9"
					/>
				</div>
			)}

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertTitle>Lỗi</AlertTitle>
					<AlertDescription>{(error as Error).message}</AlertDescription>
				</Alert>
			)}

			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
				</div>
			) : filtered.length === 0 ? (
				<div className="py-16 text-center text-muted-foreground">
					{search
						? "Không tìm thấy từ nào phù hợp."
						: "Chưa có từ vựng nào. Hãy thêm từ mới!"}
				</div>
			) : (
				<VocabularyTable
					entries={filtered}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onManageCompounds={handleManageCompounds}
				/>
			)}

			<WordFormDialog
				open={wordDialogOpen}
				onOpenChange={setWordDialogOpen}
				onSubmit={handleWordSubmit}
				entry={editingEntry}
			/>

			{compoundTarget && (
				<CompoundFormDialog
					open={compoundDialogOpen}
					onOpenChange={setCompoundDialogOpen}
					onSave={handleCompoundsSave}
					existingCompounds={compoundTarget.compounds}
				/>
			)}
		</div>
	);
}
