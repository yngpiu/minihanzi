import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/supabase/queries";
import type { DashboardStats } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useDashboardStats() {
	return useQuery<DashboardStats>({
		queryKey: queryKeys.dashboard(),
		queryFn: getDashboardStats,
		staleTime: 0,
	});
}
