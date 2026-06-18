import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
			<div
				aria-hidden
				className="text-8xl md:text-9xl font-serif text-primary/20 select-none"
			>
				汉字
			</div>
			<div className="space-y-2">
				<h1 className="text-4xl font-bold tracking-tight">Hanzier</h1>
				<p className="text-muted-foreground">
					Từ điển Trung-Việt — tra nghĩa, pinyin, ví dụ câu và phân tích AI
				</p>
			</div>
			<Link to="/dictionary">
				<Button size="lg" className="gap-2 text-base">
					<Search size={18} />
					Tra từ
				</Button>
			</Link>
		</div>
	);
}
