import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Search, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import boThuData from "../../data/50_bo_thu.json";

interface TuEntry {
	tu: string;
	pinyin: string;
	nghia: string;
}

interface BoThu {
	stt: number;
	chu_han: string;
	pinyin: string;
	han_viet: string;
	y_nghia: string;
	anh_gif: string;
	anh_minh_hoa: string;
	tu_don: TuEntry[];
	tu_ghep: TuEntry[];
}

export const Route = createFileRoute("/bo-thu")({
	component: BoThuPage,
});

function parseMainChar(chuHan: string) {
	const m = chuHan.match(/^(\S+)/);
	return m ? m[1] : chuHan;
}

function parseVariant(chuHan: string) {
	const m = chuHan.match(/\(([^)]+)\)/);
	return m ? m[1] : null;
}

function parseBoNumber(chuHan: string) {
	const m = chuHan.match(/bộ\s*(\d+)/);
	return m ? `bộ ${m[1]}` : "";
}

function range(n: number) {
	return Array.from({ length: n }, (_, i) => i);
}

function shuffleArray(arr: number[]) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function BoThuPage() {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [selectedBo, setSelectedBo] = useState<BoThu | null>(null);
	const [reviewIndex, setReviewIndex] = useState(0);
	const [shuffled, setShuffled] = useState(false);
	const [order, setOrder] = useState<number[]>(() => range(boThuData.length));

	const filtered = useMemo(() => {
		if (!search.trim()) return boThuData;
		const q = search.trim().toLowerCase();
		return (boThuData as BoThu[]).filter(
			(b) =>
				b.chu_han.toLowerCase().includes(q) ||
				b.pinyin.toLowerCase().includes(q) ||
				b.han_viet.toLowerCase().includes(q) ||
				b.y_nghia.toLowerCase().includes(q),
		);
	}, [search]);

	const current = boThuData[order[reviewIndex]] as BoThu | undefined;
	const mainChar = current ? parseMainChar(current.chu_han) : "";
	const variant = current ? parseVariant(current.chu_han) : null;

	function toggleShuffle() {
		if (shuffled) {
			setOrder(range(boThuData.length));
			setShuffled(false);
		} else {
			setOrder(shuffleArray(range(boThuData.length)));
			setShuffled(true);
		}
		setReviewIndex(0);
	}

	return (
		<div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate({ to: "/" })}
						className="mb-2"
					>
						<ArrowLeft size={16} className="mr-1" /> Trang chủ
					</Button>
					<h1 className="text-2xl font-bold tracking-tight">
						50 Bộ Thủ Thường Dùng
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Tra cứu và ôn tập các bộ thủ cơ bản trong tiếng Trung
					</p>
				</div>
			</div>

			<div className="relative max-w-md">
				<Search
					size={18}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
				/>
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Tìm bộ thủ (chữ, pinyin, nghĩa)..."
					className="pl-10"
				/>
			</div>

			<Tabs defaultValue="browse" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="browse" className="gap-1.5">
						<BookOpen size={16} /> Tra cứu
					</TabsTrigger>
					<TabsTrigger value="review" className="gap-1.5">
						<Shuffle size={16} /> Ôn tập
					</TabsTrigger>
				</TabsList>

				<TabsContent value="browse" className="space-y-4">
					{filtered.length === 0 ? (
						<p className="text-center text-muted-foreground py-12">
							Không tìm thấy bộ thủ nào
						</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{(filtered as BoThu[]).map((bo) => {
								const mainCh = parseMainChar(bo.chu_han);
								const v = parseVariant(bo.chu_han);
								const boNum = parseBoNumber(bo.chu_han);
								return (
									<Card
										key={bo.stt}
										className="cursor-pointer hover:bg-accent/50 transition-colors"
										onClick={() => setSelectedBo(bo)}
									>
										<CardContent className="p-4 space-y-3">
											<div className="flex items-start gap-3">
												<div className="size-20 shrink-0 rounded-lg overflow-hidden bg-muted">
													<img
														src={bo.anh_gif}
														alt={`${mainCh} stroke order`}
														className="size-full object-contain"
														loading="lazy"
													/>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-baseline gap-2">
														<span className="text-3xl font-serif leading-none">
															{mainCh}
														</span>
														{v && (
															<span className="text-lg text-muted-foreground font-serif">
																{v}
															</span>
														)}
													</div>
													<p className="text-xs text-muted-foreground mt-1">
														{bo.pinyin}
													</p>
													<p className="font-medium text-sm mt-0.5">
														{bo.han_viet}
													</p>
													<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
														{bo.y_nghia}
													</p>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-[10px]">
													{boNum}
												</Badge>
												<Badge variant="secondary" className="text-[10px]">
													{bo.tu_don.length + bo.tu_ghep.length} từ
												</Badge>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="review" className="space-y-4">
					{current && (
						<div className="max-w-xl mx-auto space-y-6">
							<div className="flex items-center justify-between text-sm text-muted-foreground">
								<span>
									{reviewIndex + 1} / {boThuData.length}
								</span>
								<Button
									variant="ghost"
									size="xs"
									onClick={toggleShuffle}
									className={cn("gap-1.5 text-xs", shuffled && "text-primary")}
								>
									<Shuffle size={14} />
									{shuffled ? "Đã xáo" : "Xáo trộn"}
								</Button>
							</div>

							<Card>
								<CardContent className="p-6 space-y-4">
									<div className="flex justify-center">
										<div className="size-48 rounded-xl overflow-hidden bg-muted">
											<img
												src={current.anh_gif}
												alt={`${mainChar} stroke order`}
												className="size-full object-contain"
											/>
										</div>
									</div>

									<div className="text-center space-y-1">
										<div className="flex items-center justify-center gap-2">
											<span className="text-5xl font-serif leading-none">
												{mainChar}
											</span>
											{variant && (
												<span className="text-2xl text-muted-foreground font-serif">
													({variant})
												</span>
											)}
										</div>
										<p className="text-lg text-muted-foreground">
											{current.pinyin}
										</p>
										<p className="font-medium text-base">{current.han_viet}</p>
										<p className="text-sm text-muted-foreground">
											{current.y_nghia}
										</p>
									</div>

									<div className="text-center">
										<Badge variant="outline" className="text-xs">
											Bộ thứ {current.stt} · {parseBoNumber(current.chu_han)}
										</Badge>
									</div>

									{current.anh_minh_hoa && (
										<div className="rounded-lg overflow-hidden bg-muted">
											<img
												src={current.anh_minh_hoa}
												alt={`${mainChar} minh họa`}
												className="w-full object-cover"
												loading="lazy"
											/>
										</div>
									)}

									{current.tu_don.length > 0 && (
										<div>
											<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
												Từ đơn ({current.tu_don.length})
											</p>
											<div className="divide-y rounded-lg border text-xs max-h-48 overflow-y-auto">
												{current.tu_don.map((t, i) => (
													<div
														key={i}
														className="flex items-center gap-2 px-3 py-2"
													>
														<span className="font-serif text-base min-w-[3rem] text-center">
															{t.tu}
														</span>
														<span className="text-muted-foreground min-w-[5rem]">
															{t.pinyin}
														</span>
														<span className="text-muted-foreground flex-1">
															{t.nghia}
														</span>
													</div>
												))}
											</div>
										</div>
									)}

									{current.tu_ghep.length > 0 && (
										<div>
											<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
												Từ ghép ({current.tu_ghep.length})
											</p>
											<div className="divide-y rounded-lg border text-xs">
												{current.tu_ghep.map((t, i) => (
													<div
														key={i}
														className="flex items-center gap-2 px-3 py-2"
													>
														<span className="font-serif text-sm min-w-[5rem]">
															{t.tu}
														</span>
														<span className="text-muted-foreground min-w-[5rem]">
															{t.pinyin}
														</span>
														<span className="text-muted-foreground flex-1">
															{t.nghia}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							<div className="flex items-center justify-center gap-4">
								<Button
									variant="outline"
									size="sm"
									disabled={reviewIndex === 0}
									onClick={() => setReviewIndex((i) => i - 1)}
								>
									<ArrowLeft size={16} className="mr-1" /> Trước
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={reviewIndex === boThuData.length - 1}
									onClick={() => setReviewIndex((i) => i + 1)}
								>
									Sau <ArrowRight size={16} className="ml-1" />
								</Button>
							</div>
						</div>
					)}
				</TabsContent>
			</Tabs>

			<Dialog
				open={!!selectedBo}
				onOpenChange={(o) => !o && setSelectedBo(null)}
			>
				<DialogContent className="max-w-lg max-h-[90vh]">
					{selectedBo &&
						(() => {
							const bo = selectedBo;
							const mainCh = parseMainChar(bo.chu_han);
							const v = parseVariant(bo.chu_han);
							return (
								<>
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2">
											<span className="text-2xl font-serif">{mainCh}</span>
											{v && (
												<span className="text-lg text-muted-foreground font-serif">
													({v})
												</span>
											)}
											<span className="text-xs font-normal text-muted-foreground ml-auto">
												Bộ thứ {bo.stt} · {parseBoNumber(bo.chu_han)}
											</span>
										</DialogTitle>
									</DialogHeader>

									<Tabs defaultValue="info" className="w-full">
										<TabsList className="w-full">
											<TabsTrigger value="info" className="flex-1">
												Thông tin
											</TabsTrigger>
											<TabsTrigger value="don" className="flex-1">
												Từ đơn ({bo.tu_don.length})
											</TabsTrigger>
											<TabsTrigger value="ghep" className="flex-1">
												Từ ghép ({bo.tu_ghep.length})
											</TabsTrigger>
										</TabsList>

										<TabsContent value="info" className="space-y-3 pt-3">
											<div className="flex justify-center">
												<div className="size-40 rounded-xl overflow-hidden bg-muted">
													<img
														src={bo.anh_gif}
														alt={`${mainCh} stroke order`}
														className="size-full object-contain"
													/>
												</div>
											</div>

											<div className="text-center space-y-1">
												<p className="text-base text-muted-foreground">
													{bo.pinyin}
												</p>
												<p className="font-medium">{bo.han_viet}</p>
												<p className="text-sm text-muted-foreground">
													{bo.y_nghia}
												</p>
											</div>

											{bo.anh_minh_hoa && (
												<div className="rounded-lg overflow-hidden bg-muted">
													<img
														src={bo.anh_minh_hoa}
														alt={`${mainCh} minh họa`}
														className="w-full object-cover"
														loading="lazy"
													/>
												</div>
											)}
										</TabsContent>

										<TabsContent value="don" className="pt-3">
											{bo.tu_don.length > 0 ? (
												<div className="divide-y rounded-lg border text-xs max-h-64 overflow-y-auto">
													{bo.tu_don.map((t, i) => (
														<div
															key={i}
															className="flex items-center gap-2 px-3 py-2"
														>
															<span className="font-serif text-base min-w-[3rem] text-center">
																{t.tu}
															</span>
															<span className="text-muted-foreground min-w-[5rem]">
																{t.pinyin}
															</span>
															<span className="text-muted-foreground flex-1">
																{t.nghia}
															</span>
														</div>
													))}
												</div>
											) : (
												<p className="text-center text-muted-foreground py-8 text-sm">
													Không có từ đơn
												</p>
											)}
										</TabsContent>

										<TabsContent value="ghep" className="pt-3">
											{bo.tu_ghep.length > 0 ? (
												<div className="divide-y rounded-lg border text-xs max-h-64 overflow-y-auto">
													{bo.tu_ghep.map((t, i) => (
														<div
															key={i}
															className="flex items-center gap-2 px-3 py-2"
														>
															<span className="font-serif text-sm min-w-[4rem]">
																{t.tu}
															</span>
															<span className="text-muted-foreground min-w-[5rem]">
																{t.pinyin}
															</span>
															<span className="text-muted-foreground flex-1">
																{t.nghia}
															</span>
														</div>
													))}
												</div>
											) : (
												<p className="text-center text-muted-foreground py-8 text-sm">
													Không có từ ghép
												</p>
											)}
										</TabsContent>
									</Tabs>
								</>
							);
						})()}
				</DialogContent>
			</Dialog>
		</div>
	);
}
