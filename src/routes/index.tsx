import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	BookMarked,
	BookOpen,
	GraduationCap,
	Search,
	Shuffle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathsWithSets } from "@/hooks/queries/useVocabulary";
import { useSRSStats } from "@/lib/supabase/srs";

export const Route = createFileRoute("/")({
	component: Dashboard,
});

function Dashboard() {
	const navigate = useNavigate();
	const { data: paths, isLoading } = usePathsWithSets();
	const { data: srsStats } = useSRSStats();
	const [search, setSearch] = useState("");

	const totalSets =
		paths?.reduce((s, p) => s + (p.study_sets?.length ?? 0), 0) ?? 0;
	const totalWords =
		paths?.reduce(
			(s, p) => s + (p.study_sets?.reduce((a, b) => a + b.word_count, 0) ?? 0),
			0,
		) ?? 0;

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (search.trim()) navigate({ to: "/dictionary" });
		},
		[navigate, search],
	);

	const highlightPaths = paths?.slice(0, 4) ?? [];

	return (
		<div className="mx-auto max-w-3xl p-4 md:p-6 space-y-8">
			<section className="text-center space-y-3 py-6">
				<div className="flex items-center justify-center gap-2 text-primary">
					<GraduationCap size={32} />
					<h1 className="text-3xl font-bold tracking-tight">Minihanzi</h1>
				</div>
				<p className="text-muted-foreground max-w-md mx-auto">
					Học từ vựng tiếng Trung với flashcard, SRS, kiểm tra, nghe chép và
					luyện viết
				</p>
			</section>

			<form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
				<label htmlFor="dashboard-search" className="sr-only">
					Tra từ
				</label>
				<Search
					size={18}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
					aria-hidden="true"
				/>
				<Input
					id="dashboard-search"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Tra từ (chuyển đến trang từ điển)…"
					className="pl-10"
					autoComplete="off"
				/>
			</form>

			{isLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24 rounded-lg" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<StatCard icon={BookOpen} label="Bộ từ vựng" value={totalSets} />
					<StatCard label="Từ vựng" value={totalWords} />
					<StatCard label="Lộ trình" value={paths?.length ?? 0} />
					<StatCard
						label="SRS hôm nay"
						value={srsStats?.due ?? 0}
						suffix={srsStats?.total ? ` / ${srsStats.total}` : undefined}
					/>
				</div>
			)}

			<section>
				<h2 className="text-lg font-semibold mb-3">Bắt đầu</h2>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<ActionCard
						label="Học từ"
						desc="Duyệt bộ từ vựng"
						icon={BookOpen}
						onClick={() => navigate({ to: "/learn" })}
					/>
					<ActionCard
						label="Luyện SRS"
						desc="Ôn tập ngắt quãng"
						icon={Shuffle}
						onClick={() => navigate({ to: "/learn" })}
					/>
					<ActionCard
						label="Tra từ điển"
						desc="Tra cứu Hán-Việt"
						icon={Search}
						onClick={() => navigate({ to: "/dictionary" })}
					/>
					<ActionCard
						label="Bộ thủ"
						desc="50 bộ thủ cơ bản"
						icon={BookMarked}
						onClick={() => navigate({ to: "/bo-thu" })}
					/>
				</div>
			</section>

			{highlightPaths.length > 0 && (
				<section>
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-semibold">Lộ trình học tập</h2>
						<Button
							variant="link"
							size="sm"
							className="text-xs"
							onClick={() => navigate({ to: "/learn" })}
						>
							Xem tất cả
						</Button>
					</div>
					<div className="space-y-2">
						{highlightPaths.map((path) => {
							const words =
								path.study_sets?.reduce((s, set) => s + set.word_count, 0) ?? 0;
							return (
								<button
									key={path.id}
									type="button"
									onClick={() => navigate({ to: "/learn" })}
									className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm hover:bg-accent/50 transition-colors"
								>
									<GraduationCap size={18} className="shrink-0 text-primary" />
									<span className="flex-1 truncate font-medium">
										{path.title}
									</span>
									<Badge variant="secondary" className="text-[10px] shrink-0">
										{path.study_sets?.length ?? 0} bộ · {words} từ
									</Badge>
								</button>
							);
						})}
					</div>
				</section>
			)}
		</div>
	);
}

function StatCard({
	label,
	value,
	suffix,
	icon: Icon,
}: {
	label: string;
	value: string | number;
	suffix?: string;
	icon?: React.ComponentType<{ size?: number }>;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-1 py-4">
				{Icon && <Icon size={20} className="text-primary" />}
				<span className="text-2xl font-bold tabular-nums">
					{value}
					{suffix && (
						<span className="text-sm font-normal text-muted-foreground">
							{suffix}
						</span>
					)}
				</span>
				<span className="text-xs text-muted-foreground">{label}</span>
			</CardContent>
		</Card>
	);
}

function ActionCard({
	label,
	desc,
	icon: Icon,
	onClick,
}: {
	label: string;
	desc: string;
	icon: React.ComponentType<{ size?: number }>;
	onClick: () => void;
}) {
	return (
		<Card
			className="cursor-pointer hover:bg-accent/50 transition-colors"
			onClick={onClick}
		>
			<CardContent className="flex flex-col items-center gap-1.5 py-4">
				<Icon size={22} className="text-primary" />
				<span className="text-sm font-medium">{label}</span>
				<span className="text-[10px] text-muted-foreground text-center leading-tight">
					{desc}
				</span>
			</CardContent>
		</Card>
	);
}
