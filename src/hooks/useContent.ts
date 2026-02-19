import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { 
  fetchAllContent, 
  fetchContentByType, 
  fetchContentById, 
  fetchContentPaginated,
  fetchContentByTypePaginated 
} from "@/lib/firestore";
import { fetchTmdbDetails } from "@/lib/tmdb";

export const useContent = (type?: "movie" | "tv") => {
  const { data: content = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["content", type ?? "all"],
    queryFn: () => (type ? fetchContentByType(type) : fetchAllContent()),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  return { content, loading, refetch };
};

export const useInfiniteContent = (type?: "movie" | "tv", pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: ["content-infinite", type ?? "all"],
    queryFn: ({ pageParam }) => 
      type 
        ? fetchContentByTypePaginated(type, pageSize, pageParam as any)
        : fetchContentPaginated(pageSize, pageParam as any),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
    staleTime: 5 * 60 * 1000,
  });
};

export const useContentDetail = (docId: string | undefined) => {
  const { data: content = null, isLoading: loading } = useQuery({
    queryKey: ["content-detail", docId],
    queryFn: async () => {
      const firestoreContent = await fetchContentById(docId!);
      if (!firestoreContent) return null;
      
      try {
        // Fetch credits from TMDB in real-time
        const tmdbData = await fetchTmdbDetails(firestoreContent.id, firestoreContent.media_type);
        return {
          ...firestoreContent,
          credits: tmdbData.credits
        };
      } catch (error) {
        console.error("Error fetching TMDB credits:", error);
        return firestoreContent;
      }
    },
    enabled: !!docId,
    staleTime: 5 * 60 * 1000,
  });

  return { content, loading };
};
