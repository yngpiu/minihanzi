import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
	icon: LucideIcon;
	value: number | string;
	label: string;
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center gap-1 py-4">
				<Icon size={20} className="text-muted-foreground" />
				<span className="text-2xl font-bold tabular-nums">{value}</span>
				<span className="text-xs text-muted-foreground">{label}</span>
			</CardContent>
		</Card>
	);
}
