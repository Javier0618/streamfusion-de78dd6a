import Navbar from "@/components/layout/Navbar";
import ContentCard from "@/components/home/ContentCard";
import { useContent } from "@/hooks/useContent";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

const MoviesPage = () => {
  const { content, loading } = useContent();
  
  const filtered = useMemo(
    () => content.filter((c) => c.media_type === "movie" || c.display_options?.main_sections?.includes("movies")),
    [content]
  );

  const { displayed, hasMore, sentinelRef } = useInfiniteScroll(filtered);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-12">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-8">Películas</h1>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No se encontró contenido de películas.</p>
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

export default MoviesPage;
