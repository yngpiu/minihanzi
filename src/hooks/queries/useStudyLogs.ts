import { useQuery } from "@tanstack/react-query";
import { getStudyLogs } from "@/lib/supabase/queries";
import type { StudyLog } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useStudyLogs(days = 365) {
	return useQuery<StudyLog[]>({
		queryKey: queryKeys.studyLogs(days),
		queryFn: () => getStudyLogs(days),
	});
}
