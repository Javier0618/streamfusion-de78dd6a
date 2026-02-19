import { useQuery } from "@tanstack/react-query";
import { fetchAllContent, fetchContentByType, fetchContentById } from "@/lib/firestore";

export const useContent = (type?: "movie" | "tv") => {
  const { data: content = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["content", type ?? "all"],
    queryFn: () => (type ? fetchContentByType(type) : fetchAllContent()),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  return { content, loading, refetch };
};

export const useContentDetail = (docId: string | undefined) => {
  const { data: content = null, isLoading: loading } = useQuery({
    queryKey: ["content-detail", docId],
    queryFn: () => fetchContentById(docId!),
    enabled: !!docId,
    staleTime: 5 * 60 * 1000,
  });

  return { content, loading };
};
