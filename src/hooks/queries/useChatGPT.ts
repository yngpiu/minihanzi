import { useQuery } from "@tanstack/react-query";
import { fetchChatGPT } from "@/services/hanzii";
import type { ChatGPTData } from "@/services/types";
import { queryKeys } from "./queryKeys";

export function useChatGPT(word: string, pinyin?: string) {
	return useQuery<ChatGPTData | null>({
		queryKey: queryKeys.chatGpt(word, pinyin),
		queryFn: () => fetchChatGPT(word, pinyin),
		enabled: word.length > 0,
		staleTime: 30 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		retry: 1,
	});
}
