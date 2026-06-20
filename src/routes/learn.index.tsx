import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	BookOpen,
	ChevronDown,
	ChevronRight,
	GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePathsWithSets } from "@/hooks/queries/useVocabulary";
import type { VocabPath, VocabStudySet } from "@/lib/supabase/vocabulary";

export const Route = createFileRoute("/learn/")({
	component: LearnPage,
});

function LearnPage() {
	const navigate = useNavigate();
	const { data: paths, isLoading } = usePathsWithSets();
	const [expanded, setExpanded] = useState<Set<number>>(new Set());

	function togglePath(id: number) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl p-4 md:p-6">
				<h1 className="text-2xl font-bold tracking-tight mb-6">Học từ</h1>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-20 rounded-lg bg-muted/50 animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	const tagColors: Record<string, string> = {
		HSK: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
		CERF: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
		"For Work":
			"bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
	};

	const totalSets =
		paths?.reduce((s, p) => s + (p.study_sets?.length ?? 0), 0) ?? 0;
	const totalWords =
		paths?.reduce(
			(s, p) => s + (p.study_sets?.reduce((a, b) => a + b.word_count, 0) ?? 0),
			0,
		) ?? 0;

	return (
		<div className="mx-auto max-w-3xl p-4 md:p-6">
			<div className="flex items-center gap-3 mb-6">
				<GraduationCap size={28} className="text-primary" />
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Học từ</h1>
					<p className="text-sm text-muted-foreground">
						{totalSets} bộ từ vựng {totalWords} từ
					</p>
				</div>
			</div>

			<div className="space-y-3">
				{(paths ?? []).map((path) => (
					<PathCard
						key={path.id}
						path={path}
						isOpen={expanded.has(path.id)}
						onToggle={() => togglePath(path.id)}
						onSelectSet={(set) =>
							navigate({ to: "/learn/$id", params: { id: String(set.id) } })
						}
						tagColor={
							tagColors[path.tags] ||
							"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
						}
					/>
				))}
			</div>
		</div>
	);
}

function PathCard({
	path,
	isOpen,
	onToggle,
	onSelectSet,
	tagColor,
}: {
	path: VocabPath;
	isOpen: boolean;
	onToggle: () => void;
	onSelectSet: (set: VocabStudySet) => void;
	tagColor: string;
}) {
	const totalWords =
		path.study_sets?.reduce((s, set) => s + set.word_count, 0) ?? 0;

	return (
		<div className="rounded-lg border bg-card">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/50 transition-colors rounded-lg"
			>
				{isOpen ? (
					<ChevronDown size={18} className="shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight size={18} className="shrink-0 text-muted-foreground" />
				)}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium truncate">{path.title}</span>
						<span
							className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tagColor}`}
						>
							{path.tags}
						</span>
					</div>
					<div className="text-xs text-muted-foreground mt-0.5">
						{path.study_sets?.length ?? 0} bộ · {totalWords} từ
					</div>
				</div>
				<BookOpen size={16} className="shrink-0 text-muted-foreground" />
			</button>

			{isOpen && (
				<div className="border-t px-4 py-2 space-y-0.5">
					{(path.study_sets ?? []).map((set) => (
						<button
							key={set.id}
							type="button"
							onClick={() => onSelectSet(set)}
							className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
						>
							<span className="size-1.5 rounded-full bg-primary/40 shrink-0" />
							<span className="flex-1 text-left truncate">{set.title}</span>
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0 font-normal shrink-0"
							>
								{set.word_count}
							</Badge>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
