import {
	createRootRoute,
	Outlet,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import {
	BookOpen,
	Menu,
	Monitor,
	Moon,
	Search,
	Sun,
	Table,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { SearchContext } from "@/lib/dictionary/search-context";
import "../styles.css";

type Theme = "light" | "dark" | "auto";

function getTheme(): Theme {
	if (typeof window === "undefined") return "auto";
	const s = localStorage.getItem("theme") as Theme | null;
	if (s === "light" || s === "dark") return s;
	return "auto";
}

function applyTheme(t: Theme) {
	const isDark =
		t === "dark" ||
		(t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.classList.toggle("dark", isDark);
	document.documentElement.setAttribute(
		"data-theme",
		isDark ? "dark" : "light",
	);
	document.documentElement.style.colorScheme = isDark ? "dark" : "light";
	localStorage.setItem("theme", t);
}

const THEME_CYCLE: Theme[] = ["light", "dark", "auto"];

const ThemeIcon = { light: Sun, dark: Moon, auto: Monitor };

function InlineThemeScript() {
	const script = `(function(){try{var t=localStorage.getItem('theme'),d=matchMedia('(prefers-color-scheme: dark)').matches,r=t==='light'||t==='dark'?t:d?'dark':'light';document.documentElement.classList.toggle('dark',r==='dark');document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;}catch(e){}})()`;
	return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const router = useRouter();
	const navigate = useNavigate();
	const [theme, setTheme] = useState<Theme>(getTheme);
	const [sheetOpen, setSheetOpen] = useState(false);

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	useEffect(() => {
		if (theme !== "auto") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => applyTheme("auto");
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [theme]);

	function cycleTheme() {
		const idx = THEME_CYCLE.indexOf(theme);
		setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
	}

	const Icon = ThemeIcon[theme];

	let urlQ = "";
	try {
		urlQ = new URLSearchParams(router.state.location.search).get("q") ?? "";
	} catch {}

	const [q, setQ] = useState(urlQ);

	useEffect(() => {
		const unsub = router.subscribe("onResolved", () => {
			try {
				setQ(new URLSearchParams(router.state.location.search).get("q") ?? "");
			} catch {}
		});
		return unsub;
	}, [router]);

	return (
		<>
			<InlineThemeScript />
			<SearchContext.Provider value={{ searchValue: q, setSearchValue: setQ }}>
				<div className="flex min-h-screen flex-col">
					<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
						<div className="mx-auto flex h-14 max-w-5xl items-center gap-1 sm:gap-4 px-3 sm:px-4">
							<button
								type="button"
								onClick={() => navigate({ to: "/dictionary" })}
								className="flex items-center gap-1.5 sm:gap-2 font-semibold shrink-0"
							>
								<div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif text-base sm:text-lg">
									漢
								</div>
								<span className="hidden sm:inline">Minihanzi</span>
							</button>

							<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
								<SheetTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="sm:hidden"
										aria-label="Menu"
									>
										<Menu size={18} />
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="w-64">
									<SheetHeader>
										<SheetTitle>Minihanzi</SheetTitle>
									</SheetHeader>
									<div className="flex flex-col gap-1 px-4">
										<SheetClose asChild>
											<Button
												variant="ghost"
												className="justify-start gap-3"
												onClick={() => navigate({ to: "/dictionary" })}
											>
												<Search size={16} /> Tra từ
											</Button>
										</SheetClose>
										<SheetClose asChild>
											<Button
												variant="ghost"
												className="justify-start gap-3"
												onClick={() => navigate({ to: "/phonetic" })}
											>
												<Table size={16} /> Bảng phiên âm
											</Button>
										</SheetClose>
										<SheetClose asChild>
											<Button
												variant="ghost"
												className="justify-start gap-3"
												onClick={() => navigate({ to: "/learn" })}
											>
												<BookOpen size={16} /> Học từ
											</Button>
										</SheetClose>
									</div>
								</SheetContent>
							</Sheet>

							<nav className="hidden sm:flex items-center gap-0.5">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate({ to: "/dictionary" })}
									className="gap-1.5"
									aria-label="Tra từ"
								>
									<Search size={14} />
									<span>Tra từ</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate({ to: "/phonetic" })}
									className="gap-1.5"
									aria-label="Bảng phiên âm"
								>
									<Table size={14} />
									<span>Bảng phiên âm</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate({ to: "/learn" })}
									className="gap-1.5"
									aria-label="Học từ"
								>
									<BookOpen size={14} />
									<span>Học từ</span>
								</Button>
							</nav>

							<div className="flex-1" />

							<button
								type="button"
								onClick={cycleTheme}
								className="flex size-7 sm:size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
								title={`Chủ đề: ${theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Tự động"}`}
								aria-label={`Chủ đề: ${theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Tự động"}`}
							>
								<Icon size={16} />
							</button>
						</div>
					</header>

					<main className="flex-1">
						<Outlet />
					</main>
				</div>
			</SearchContext.Provider>
		</>
	);
}
