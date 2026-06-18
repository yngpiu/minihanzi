import { Bot } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatGPTData } from "@/services/types";

export function AIPanel({
	data,
	isLoading,
	isError,
}: {
	data: ChatGPTData | null | undefined;
	isLoading: boolean;
	isError: boolean;
}) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		);
	}

	if (isError || !data?.found || !data.result?.[0]?.chat_gpt?.length) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-sm text-muted-foreground">
					Không có dữ liệu AI cho từ này.
				</p>
			</div>
		);
	}

	const qas = data.result[0].chat_gpt;
	return (
		<Accordion type="single" collapsible className="w-full">
			{qas.map((qa, i) => (
				<AccordionItem key={i} value={`qa-${i}`}>
					<AccordionTrigger className="text-sm gap-2">
						<Bot size={13} className="shrink-0 text-primary" />
						{qa.question}
					</AccordionTrigger>
					<AccordionContent className="text-sm text-muted-foreground">
						{qa.answer}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}
