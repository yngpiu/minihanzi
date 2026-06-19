import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, BookMarked, Clock, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WordEntry } from "@/components/word-entry/WordEntry";
import { useSuggest, useWordSearch } from "@/hooks/queries";
import { useSearchContext } from "@/lib/dictionary/search-context";

interface SP {
	q?: string;
}

export const Route = createFileRoute("/dictionary")({
	validateSearch: (s): SP => ({ q: typeof s.q === "string" ? s.q : undefined }),
	component: Dictionary,
});

const EXAMPLES = ["你好", "谢谢", "爱情", "朋友", "学习", "中国"];

interface HistoryItem {
	word: string;
	pinyin?: string;
	meaning?: string;
}

const HISTORY_KEY = "search-history";
const MAX_HISTORY = 10;

function getHistory(): HistoryItem[] {
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveHistory(item: HistoryItem): HistoryItem[] {
	const history = getHistory();
	const filtered = history.filter((h) => h.word !== item.word);
	const updated = [item, ...filtered].slice(0, MAX_HISTORY);
	localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
	return updated;
}

function Dictionary() {
	const nav = useNavigate({ from: "/dictionary" });
	const { q } = Route.useSearch();
	const { searchValue, setSearchValue } = useSearchContext();

	const queryToSearch = q ?? "";
	const { data, isLoading, error } = useWordSearch(queryToSearch);
	const results =
		data?.result?.filter((r) => r.word && r.search_all_means?.length) || [];
	const hasQuery = queryToSearch.trim().length > 0;
	const notFound =
		hasQuery &&
		!isLoading &&
		!error &&
		data &&
		(!data.found || results.length === 0);

	const [active, setActive] = useState(0);
	const [debounced, setDebounced] = useState("");
	const [suggestOpen, setSuggestOpen] = useState(false);
	const [cursor, setCursor] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const submittedRef = useRef(false);
	const [history, setHistory] = useState<HistoryItem[]>(() => getHistory());
	const [historyOpen, setHistoryOpen] = useState(false);

	const trimmed = searchValue.trim();

	useEffect(() => {
		const t = setTimeout(() => setDebounced(trimmed), 200);
		return () => clearTimeout(t);
	}, [trimmed]);

	const { data: suggestData } = useSuggest(debounced);
	const suggestItems = suggestData || [];
	const suggestItemsRef = useRef(suggestItems);
	suggestItemsRef.current = suggestItems;

	useEffect(() => {
		if (submittedRef.current) return;
		if (trimmed && suggestItems.length > 0) {
			setSuggestOpen(true);
			setCursor(-1);
		} else {
			setSuggestOpen(false);
		}
	}, [trimmed, suggestItems]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
				setSuggestOpen(false);
				setHistoryOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (trimmed.length > 0) setHistoryOpen(false);
	}, [trimmed]);

	const search = useCallback(
		(targetQ: string) => {
			submittedRef.current = true;
			setSearchValue(targetQ);
			setActive(0);
			setSuggestOpen(false);
			setHistoryOpen(false);
			if (targetQ) {
				const found = suggestItemsRef.current.find((s) => s.word === targetQ);
				const updated = saveHistory(found ?? { word: targetQ });
				setHistory(updated);
			}
			nav({ search: targetQ ? { q: targetQ } : {} });
		},
		[setSearchValue, nav],
	);

	function submit(q?: string) {
		const target = q || trimmed;
		if (target) search(target);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			const items = historyOpen ? history : suggestItems;
			setCursor((prev) => Math.min(prev + 1, items.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setCursor((prev) => Math.max(prev - 1, 0));
		} else if (e.key === "Enter") {
			if (cursor >= 0) {
				const word = historyOpen
					? history[cursor]?.word
					: suggestItems[cursor]?.word;
				if (word) submit(word);
			} else {
				submit();
			}
		} else if (e.key === "Escape") {
			setSuggestOpen(false);
			setHistoryOpen(false);
		}
	}

	return (
		<div className="mx-auto max-w-5xl">
			<div className="pt-4 pb-3 px-4 md:px-0">
				<div className="flex gap-2">
					<div ref={wrapRef} className="relative flex-1">
						<Input
							ref={inputRef}
							placeholder="Nhập từ Hán (ví dụ: 你好, xiexie, bạn bè)..."
							value={searchValue}
							onChange={(e) => {
								submittedRef.current = false;
								setSearchValue(e.target.value);
								if (!e.target.value.trim() && history.length > 0) {
									setHistoryOpen(true);
									setCursor(-1);
								}
							}}
							onKeyDown={handleKeyDown}
							onFocus={(e) => {
								if (searchValue.trim() && suggestItems.length > 0) {
									setSuggestOpen(true);
									setCursor(-1);
								} else if (!searchValue.trim() && history.length > 0) {
									setHistoryOpen(true);
									setCursor(-1);
								}
								e.target.select();
							}}
							className="h-11 text-base"
						/>
						{((suggestOpen && suggestItems.length > 0) ||
							(historyOpen && history.length > 0)) && (
							<div
								className="scrollbar-thin absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg max-h-90 overflow-y-auto"
								role="listbox"
							>
								{historyOpen &&
									history.map((item, i) => (
										<button
											key={"h-" + item.word}
											type="button"
											role="option"
											aria-selected={i === cursor}
											className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground ${i === cursor ? "bg-accent" : ""}`}
											onMouseEnter={() => setCursor(i)}
											onClick={() => submit(item.word)}
										>
											<Clock
												size={13}
												className="mt-0.5 shrink-0 text-muted-foreground"
											/>
											<div className="min-w-0">
												<div>
													<span className="font-medium">{item.word}</span>
													{item.pinyin && (
														<span className="ml-1.5 text-xs text-muted-foreground">
															{item.pinyin}
														</span>
													)}
												</div>
												{item.meaning && (
													<div className="text-xs text-muted-foreground truncate">
														{item.meaning}
													</div>
												)}
											</div>
										</button>
									))}
								{suggestOpen &&
									suggestItems.map((item, i) => (
										<button
											key={"s-" + item.word}
											type="button"
											role="option"
											aria-selected={i === cursor}
											className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground ${i === cursor ? "bg-accent" : ""}`}
											onMouseEnter={() => setCursor(i)}
											onClick={() => submit(item.word)}
										>
											<BookMarked
												size={13}
												className="mt-0.5 shrink-0 text-muted-foreground"
											/>
											<div className="min-w-0">
												<div>
													<span className="font-medium">{item.word}</span>
													{item.pinyin && (
														<span className="ml-1.5 text-xs text-muted-foreground">
															{item.pinyin}
														</span>
													)}
												</div>
												{item.meaning && (
													<div className="text-xs text-muted-foreground truncate">
														{item.meaning}
													</div>
												)}
											</div>
										</button>
									))}
							</div>
						)}
					</div>
					<Button onClick={() => submit()} className="h-11 px-5 shrink-0">
						Tra
					</Button>
				</div>
			</div>

			<div className="px-4 md:px-0 pt-4">
				{!hasQuery ? (
					<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
						<div
							aria-hidden
							className="text-7xl md:text-9xl font-serif text-primary/20 select-none"
						>
							汉字
						</div>
						<div className="space-y-2">
							<h1 className="text-3xl font-bold tracking-tight">
								Từ điển Trung-Việt
							</h1>
							<p className="text-muted-foreground">
								Tra nghĩa, pinyin, ví dụ câu và phân tích AI...
							</p>
						</div>
						<div className="flex flex-wrap gap-2 justify-center">
							{EXAMPLES.map((w) => (
								<Badge
									key={w}
									variant="outline"
									className="cursor-pointer text-sm py-1.5 px-3"
									onClick={() => search(w)}
								>
									{w}
								</Badge>
							))}
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{error && !isLoading && (
							<Alert variant="destructive">
								<AlertCircle size={15} />
								<AlertTitle>Lỗi</AlertTitle>
								<AlertDescription>{(error as Error).message}</AlertDescription>
							</Alert>
						)}

						{isLoading && (
							<div className="space-y-3">
								<Skeleton className="h-48 w-full rounded-xl" />
								<Skeleton className="h-24 w-full rounded-xl" />
								<Skeleton className="h-24 w-full rounded-xl" />
							</div>
						)}

						{notFound && (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<Search
									size={36}
									className="text-muted-foreground/50 mb-4"
									strokeWidth={1.5}
								/>
								<p className="text-lg font-medium mb-1">Không tìm thấy</p>
								<p className="text-sm text-muted-foreground">
									Không có kết quả cho <strong>{queryToSearch}</strong>
								</p>
							</div>
						)}

						{!isLoading && results.length > 0 && (
							<>
								{results.length > 1 && (
									<div className="flex flex-wrap gap-1.5">
										{results.map((r, i) => (
											<Button
												key={r.id || r._id || i}
												variant={i === active ? "default" : "secondary"}
												size="sm"
												onClick={() => setActive(i)}
											>
												{r.pinyin || r.word || `#${i + 1}`}
											</Button>
										))}
									</div>
								)}

								{results.map((r, i) => (
									<div key={r.id || r._id || i} hidden={i !== active}>
										<WordEntry word={r} onSearch={search} />
									</div>
								))}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
