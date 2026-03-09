"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getFeedClips, type FeedClip } from "@/actions/clips";

export function useFeedClips() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      return getFeedClips(pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useFeedClipsSimple(initialClips: FeedClip[]) {
  return useQuery({
    queryKey: ["feed", "simple"],
    queryFn: async () => {
      const { clips } = await getFeedClips();
      return clips;
    },
    initialData: initialClips,
    staleTime: 30_000,
  });
}
