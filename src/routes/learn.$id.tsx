import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	Ear,
	MessageSquareText,
	PenLine,
	Shuffle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudySet } from "@/hooks/queries/useVocabulary";

export const Route = createFileRoute("/learn/$id")({
	component: StudySetLayout,
});

function StudySetLayout() {
	const matches = useRouterState({ select: (s) => s.matches });
	const lastRouteId = matches[matches.length - 1]?.routeId;
	const isDetail = lastRouteId === Route.id;

	if (!isDetail) {
		return <Outlet />;
	}

	return <StudySetPage />;
}

function StudySetPage() {
	const { id } = Route.useParams();
	const numericId = Number(id);
	const navigate = useNavigate();

	const { data: set, isLoading } = useStudySet(numericId);

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl p-4 md:p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-6 w-32 mb-6" />
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	if (!set) {
		return (
			<div className="mx-auto max-w-3xl p-4 md:p-6">
				<Button variant="ghost" onClick={() => navigate({ to: "/learn" })}>
					<ArrowLeft size={16} className="mr-1" /> Quay lại
				</Button>
				<p className="mt-8 text-center text-muted-foreground">
					Không tìm thấy bộ từ này
				</p>
			</div>
		);
	}

	const modes = [
		{
			label: "Học",
			icon: MessageSquareText,
			to: "/learn/$id/hoc",
			desc: "Flashcard lật thẻ",
		},
		{
			label: "SRS",
			icon: Shuffle,
			to: "/learn/$id/srs",
			desc: "Ôn tập ngắt quãng",
		},
		{
			label: "Kiểm tra",
			icon: Shuffle,
			to: "/learn/$id/kiem-tra",
			desc: "Trắc nghiệm",
		},
		{
			label: "Nghe chép",
			icon: Ear,
			to: "/learn/$id/nghe-chep",
			desc: "Nghe viết chính tả",
		},
		{
			label: "Luyện viết",
			icon: PenLine,
			to: "/learn/$id/luyen-viet",
			desc: "Tập viết chữ Hán",
		},
	];

	return (
		<div className="mx-auto max-w-3xl p-4 md:p-6">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => navigate({ to: "/learn" })}
				className="mb-4"
			>
				<ArrowLeft size={16} className="mr-1" /> Thư viện
			</Button>

			<div className="mb-6">
				<h1 className="text-2xl font-bold tracking-tight">{set.title}</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{set.words.length} từ
				</p>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
				{modes.map((mode) => (
					<Card
						key={mode.label}
						className="cursor-pointer hover:bg-accent/50 transition-colors"
						onClick={() => navigate({ to: mode.to, params: { id } })}
					>
						<CardContent className="flex flex-col items-center gap-1.5 py-4">
							<mode.icon size={22} className="text-primary" />
							<span className="text-sm font-medium">{mode.label}</span>
							<span className="text-[10px] text-muted-foreground text-center leading-tight">
								{mode.desc}
							</span>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="space-y-1">
				{set.words.map((word, i) => (
					<div
						key={word.id}
						className="flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm hover:bg-accent/30 transition-colors"
					>
						<span className="w-6 shrink-0 text-xs text-muted-foreground">
							{i + 1}
						</span>
						<span className="font-serif text-lg min-w-[4rem]">
							{word.hanzi}
						</span>
						<span className="text-muted-foreground min-w-[6rem]">
							{word.pinyin}
						</span>
						<span className="flex-1 text-muted-foreground truncate hidden sm:block">
							{word.vietnamese}
						</span>
						<Badge
							variant="secondary"
							className="text-[10px] px-1.5 py-0 shrink-0"
						>
							{word.type}
						</Badge>
					</div>
				))}
			</div>
		</div>
	);
}
