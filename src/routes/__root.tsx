import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
	BarChart3,
	BookMarked,
	GraduationCap,
	LayoutDashboard,
	Monitor,
	Moon,
	Search,
	Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const router = useRouter();

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
				<TooltipProvider>
					<SidebarProvider defaultOpen={false}>
						<AppSidebar />
						<SidebarInset>
							<header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur sticky top-0 z-10 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
								<div className="flex items-center gap-2 px-4">
									<SidebarTrigger className="-ml-1" />
									<Separator
										orientation="vertical"
										className="mr-2 data-[orientation=vertical]:h-4"
									/>
								</div>
							</header>

							<main className="flex-1">
								<Outlet />
							</main>

							<footer className="border-t py-3 text-center text-xs text-muted-foreground">
								<span>
									© {new Date().getFullYear()} Hanzier · Từ điển Trung-Việt
								</span>
							</footer>
						</SidebarInset>
					</SidebarProvider>
				</TooltipProvider>
			</SearchContext.Provider>

			<TanStackDevtools
				config={{ position: "bottom-right" }}
				plugins={[{ name: "Router", render: <TanStackRouterDevtoolsPanel /> }]}
			/>
		</>
	);
}

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="/">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif text-lg">
									漢
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">Hanzier</span>
									<span className="truncate text-xs">Từ điển Trung-Việt</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Dashboard">
								<a href="/">
									<LayoutDashboard size={16} />
									<span>Dashboard</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Ôn tập">
								<a href="/review">
									<GraduationCap size={16} />
									<span>Ôn tập</span>
									<Badge
										variant="outline"
										className="ml-auto text-xs font-normal"
									>
										SRS
									</Badge>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Kho từ vựng">
								<a href="/vocabulary">
									<BookMarked size={16} />
									<span>Kho từ vựng</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Thống kê">
								<a href="/analytics">
									<BarChart3 size={16} />
									<span>Thống kê</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Tra từ">
								<a href="/dictionary">
									<Search size={16} />
									<span>Tra từ</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<ThemeDropdown />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

function InlineThemeScript() {
	const script = `(function(){try{var t=localStorage.getItem('theme'),d=matchMedia('(prefers-color-scheme: dark)').matches,r=t==='light'||t==='dark'?t:d?'dark':'light';document.documentElement.classList.toggle('dark',r==='dark');document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;}catch(e){}})()`;
	return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ThemeDropdown() {
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

	function cycleTheme(t: Theme) {
		setTheme(t);
		applyTheme(t);
	}

	const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton variant="outline" className="gap-2">
					<ThemeIcon size={15} />
					<span>Chủ đề</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent side="top" align="center">
				<DropdownMenuItem onClick={() => cycleTheme("light")} className="gap-2">
					<Sun size={14} /> Sáng
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => cycleTheme("dark")} className="gap-2">
					<Moon size={14} /> Tối
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => cycleTheme("auto")} className="gap-2">
					<Monitor size={14} /> Tự động
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
