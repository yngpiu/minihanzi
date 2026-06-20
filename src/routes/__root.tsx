import {
	createRootRoute,
	Outlet,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { BookOpen, Monitor, Moon, Search, Sun, Table } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
						<div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
							<button
								type="button"
								onClick={() => navigate({ to: "/dictionary" })}
								className="flex items-center gap-2 font-semibold shrink-0"
							>
								<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif text-lg">
									漢
								</div>
								<span className="hidden sm:inline">Minihanzi</span>
							</button>

							<nav className="flex items-center gap-1 ml-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate({ to: "/dictionary" })}
									className="gap-1.5"
								>
									<Search size={14} />
									<span>Tra từ</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate({ to: "/phonetic" })}
									className="gap-1.5"
								>
									<Table size={14} />
									<span>Bảng phiên âm</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate({ to: "/learn" })}
									className="gap-1.5"
								>
									<BookOpen size={14} />
									<span>Học từ</span>
								</Button>
							</nav>

							<div className="flex-1" />

							<button
								type="button"
								onClick={cycleTheme}
								className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
