import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import ContentCard from "@/components/home/ContentCard";
import { useContent } from "@/hooks/useContent";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { getGenreName } from "@/lib/genres";
import { Loader2 } from "lucide-react";

const CategoryPage = () => {
  const { type } = useParams<{ type: string }>();
  const { content, loading } = useContent();

  const platformIds = ["netflix", "disney", "hbo", "prime", "paramount"];
  const platformLabels: Record<string, string> = {
    netflix: "Netflix", disney: "Disney+", hbo: "Max", prime: "Prime Video", paramount: "Paramount+",
  };

  const isMediaType = type === "movies" || type === "series";
  const isPlatform = !!type && platformIds.includes(type);
  const mediaFilter = type === "movies" ? "movie" : "tv";

  const filtered = useMemo(() => {
    if (isMediaType) return content.filter((c) => c.media_type === mediaFilter);
    if (isPlatform) return content.filter((c) => c.display_options?.platforms?.includes(type!));
    return content.filter((c) => c.genres?.some((g) => g === type || getGenreName(g) === decodeURIComponent(type || "")));
  }, [content, type, isMediaType, isPlatform, mediaFilter]);

  const title = isMediaType
    ? type === "movies" ? "Películas" : "Series"
    : isPlatform
    ? platformLabels[type!] ?? decodeURIComponent(type || "")
    : decodeURIComponent(type || "");

  const { displayed, hasMore, sentinelRef } = useInfiniteScroll(filtered);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-12">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-8">{title}</h1>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No se encontró contenido.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {displayed.map((item, i) => (
                <ContentCard key={item.docId || item.id} content={item} index={i % 30} grid />
              ))}
            </div>
            <div ref={sentinelRef} className="flex justify-center py-8">
              {hasMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
