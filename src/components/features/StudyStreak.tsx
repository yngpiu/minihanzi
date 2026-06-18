import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StudyStreakProps {
	streak: number;
	completedToday: boolean;
}

export function StudyStreak({ streak, completedToday }: StudyStreakProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center gap-1 py-4">
				<Flame
					size={28}
					className={
						streak > 0 ? "text-orange-500" : "text-muted-foreground/40"
					}
					fill={streak > 0 ? "currentColor" : "none"}
				/>
				<span className="text-2xl font-bold tabular-nums">{streak}</span>
				<span className="text-xs text-muted-foreground">Chuỗi ngày</span>
				{completedToday && (
					<span className="text-[10px] text-green-600 font-medium">
						Đã học hôm nay
					</span>
				)}
			</CardContent>
		</Card>
	);
}
