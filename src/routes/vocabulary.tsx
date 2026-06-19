import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { VocabTable } from "@/components/features/VocabTable";

export const Route = createFileRoute("/vocabulary")({
	component: VocabularyPage,
});

function VocabularyPage() {
	useEffect(() => {
		document.title = "Kho từ vựng - Minihanzi";
	}, []);
	return (
		<div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Kho từ vựng</h1>
			</div>
			<VocabTable />
		</div>
	);
}
