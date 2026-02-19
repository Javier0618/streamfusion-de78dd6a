import { useMemo, useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import ContentCarousel from "@/components/home/ContentCarousel";
import PlatformFilter from "@/components/home/PlatformFilter";
import Navbar from "@/components/layout/Navbar";
import { useContent, useInfiniteContent } from "@/hooks/useContent";
import { getGenreName } from "@/lib/genres";
import { fetchWebConfig } from "@/lib/firestore";

const Index = () => {
  // Use paginated content for the main list to avoid loading everything at once
  const { 
    data, 
    isLoading: loadingInfinite,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteContent(undefined, 50);

  // Still use useContent for specialized sections if needed, or better, derive from paginated data
  // For the home sections (estreno, agregado), we might still need a targeted fetch or just use the first page
  const { content, loading: loadingAll } = useContent();
  const [webConfig, setWebConfig] = useState<any>(null);

  const loading = loadingAll && loadingInfinite;

  useEffect(() => {
    fetchWebConfig().then((config) => setWebConfig(config)).catch(console.error);
  }, []);

  const heroContent = useMemo(() => {
    if (content.length === 0) return null;
    const withBackdrop = content.filter((c) => c.backdrop_path);
    return withBackdrop.length > 0
      ? withBackdrop[Math.floor(Math.random() * withBackdrop.length)]
      : content[0];
  }, [content]);

  const movies = useMemo(() => content.filter((c) => c.media_type === "movie"), [content]);
  const series = useMemo(() => content.filter((c) => c.media_type === "tv"), [content]);

  const enEstreno = useMemo(
    () => content
      .filter((c) => c.display_options?.home_sections?.includes("estreno"))
      .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || "")),
    [content]
  );

  const recienAgregado = useMemo(
    () => content
      .filter((c) => c.display_options?.home_sections?.includes("agregado"))
      .sort((a, b) => (b.imported_at?.seconds || 0) - (a.imported_at?.seconds || 0)),
    [content]
  );

  const genreGroups = useMemo(() => {
    const genres = new Map<string, typeof content>();
    content.forEach((c) => {
      c.genres?.forEach((g) => {
        const name = getGenreName(g);
        if (!genres.has(name)) genres.set(name, []);
        genres.get(name)!.push(c);
      });
    });
    return genres;
  }, [content]);

  const sections = webConfig?.homepageSections || { enEstreno: 20, recienAgregado: 20, peliculasPopulares: 20, seriesPopulares: 20 };

  const isCategoryVisible = (key: string) => {
    if (!webConfig?.visibleCategories || webConfig.visibleCategories.length === 0) return true;
    return webConfig.visibleCategories.includes(key);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-[85vh] animate-pulse bg-muted" />
        <div className="px-4 md:px-12 mt-8 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-48 bg-muted rounded mb-4" />
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="w-[180px] aspect-[2/3] bg-muted rounded-md flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero content={heroContent} allContent={content} />

      <div className="relative z-10 pb-16">
        <PlatformFilter content={content} visiblePlatforms={webConfig?.visiblePlatforms} platformImages={webConfig?.platformImages} />
        {isCategoryVisible("enEstreno") && enEstreno.length > 0 && <ContentCarousel title="En Estreno/Emisión" items={enEstreno.slice(0, sections.enEstreno)} />}
        {isCategoryVisible("recienAgregado") && recienAgregado.length > 0 && <ContentCarousel title="Recién Agregado" items={recienAgregado.slice(0, sections.recienAgregado)} />}
        {isCategoryVisible("peliculas") && movies.length > 0 && <ContentCarousel title="Películas Populares" items={movies.slice(0, sections.peliculasPopulares)} viewAllLink="/category/movies" />}
        {isCategoryVisible("series") && series.length > 0 && <ContentCarousel title="Series Populares" items={series.slice(0, sections.seriesPopulares)} viewAllLink="/category/series" />}
        {Array.from(genreGroups.entries())
          .filter(([genre]) => isCategoryVisible(genre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
          .map(([genre, items]) => (
          <ContentCarousel
            key={genre}
            title={genre}
            items={items.slice(0, 20)}
            viewAllLink={`/category/${encodeURIComponent(genre)}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
