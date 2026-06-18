import { createFileRoute } from "@tanstack/react-router";
import { Flashcard } from "@/components/features/Flashcard";

export const Route = createFileRoute("/review")({
	component: ReviewPage,
});

function ReviewPage() {
	return (
		<div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Ôn tập</h1>
				<p className="text-sm text-muted-foreground">
					Lật thẻ và đánh giá khả năng ghi nhớ
				</p>
			</div>
			<Flashcard />
		</div>
	);
}
