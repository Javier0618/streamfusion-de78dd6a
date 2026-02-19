import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useContentDetail, useContent } from "@/hooks/useContent";
import Navbar from "@/components/layout/Navbar";
import VideoPlayer from "@/components/content/VideoPlayer";
import ContentCard from "@/components/home/ContentCard";
import { Play, ArrowLeft, Star, Calendar, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { getBackdropUrl, getImageUrl } from "@/lib/image";
import { extractDocId } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";
import { addToMyList, removeFromMyList, fetchMyList } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const ContentPage = () => {
  // Soporta /pelicula/:slug, /serie/:slug y /content/:id (legado)
  const { slug, id } = useParams();
  const [searchParams] = useSearchParams();
  const rawParam = slug ?? id ?? "";
  const docId = slug ? extractDocId(rawParam) : rawParam;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { content, loading } = useContentDetail(docId);
  const isMobile = useIsMobile();
  const { content: allContent } = useContent();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [inMyList, setInMyList] = useState(false);

  // Autoplay: si viene ?autoplay=1, iniciar reproducción automáticamente
  useEffect(() => {
    if (searchParams.get("autoplay") === "1" && content) {
      if (content.media_type === "movie" && content.video_url) {
        setPlayingUrl(content.video_url);
      } else if (content.media_type === "tv" && content.seasons) {
        const firstSeasonKey = Object.keys(content.seasons)[0];
        if (firstSeasonKey) {
          const episodes = content.seasons[firstSeasonKey].episodes;
          const firstEpKey = Object.keys(episodes)[0];
          if (firstEpKey && episodes[firstEpKey].video_url) {
            setPlayingUrl(episodes[firstEpKey].video_url);
          }
        }
      }
    }
  }, [content, searchParams]);

  useEffect(() => {
    if (!user || !content) return;
    fetchMyList(user.uid).then((list) => {
      setInMyList(list.some((item: any) => item.id === content.id));
    });
  }, [user, content]);

  const handleToggleList = async () => {
    if (!user || !content) return;
    if (inMyList) {
      await removeFromMyList(user.uid, content.id);
      setInMyList(false);
      toast({ title: "Eliminado de tu lista" });
    } else {
      await addToMyList(user.uid, {
        id: content.id,
        media_type: content.media_type,
        title: content.title,
        poster_path: content.poster_path,
        release_date: content.release_date,
      });
      setInMyList(true);
      toast({ title: "Agregado a tu lista!" });
    }
  };

  // Related: same media_type + at least 1 genre in common, excluding current
  const related = useMemo(() => {
    if (!content || allContent.length === 0) return [];
    const currentGenres = new Set(content.genres ?? []);
    return allContent
      .filter(
        (c) =>
          c.docId !== content.docId &&
          c.media_type === content.media_type &&
          (c.genres ?? []).some((g) => currentGenres.has(g))
      )
      .sort((a, b) => {
        // Sort by number of shared genres (more = closer)
        const sharedA = (a.genres ?? []).filter((g) => currentGenres.has(g)).length;
        const sharedB = (b.genres ?? []).filter((g) => currentGenres.has(g)).length;
        return sharedB - sharedA;
      })
      .slice(0, 12);
  }, [content, allContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-[60vh] animate-pulse bg-muted" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <p className="text-muted-foreground">Contenido no encontrado</p>
      </div>
    );
  }

  const seasons = content.seasons ? Object.entries(content.seasons) : [];
  const activeSeason = selectedSeason || (seasons.length > 0 ? seasons[0][0] : null);
  const episodes = activeSeason && content.seasons?.[activeSeason]?.episodes
    ? Object.entries(content.seasons[activeSeason].episodes)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop */}
      {!playingUrl && (
        <div className="relative h-[50vh] md:h-[60vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getBackdropUrl(content.backdrop_path || content.poster_path)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        </div>
      )}

      {/* Player */}
      {playingUrl && (
        <div className="pt-20 px-4 md:px-12">
          <VideoPlayer url={playingUrl} title={content.title} />
        </div>
      )}

      <div className={`relative z-10 px-4 md:px-12 ${playingUrl ? "mt-6" : "-mt-32"} pb-16`}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-48 md:w-64">
            <img src={getImageUrl(content.poster_path)} alt={content.title} className="w-full rounded-lg shadow-lg" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{content.title}</h1>
            {content.original_title && content.original_title !== content.title && (
              <p className="text-muted-foreground text-sm mb-3">{content.original_title}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
              {content.vote_average != null && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" /> {content.vote_average.toFixed(1)}
                </span>
              )}
              {content.release_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {content.release_date}
                </span>
              )}
              <span className="uppercase text-xs border border-border px-2 py-0.5 rounded">
                {content.media_type === "movie" ? "Película" : "Serie"}
              </span>
            </div>

            {content.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {content.genres.map((g) => (
                  <span key={g} className="bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full">{g}</span>
                ))}
              </div>
            )}

            <p className="text-secondary-foreground leading-relaxed mb-6">{content.overview}</p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {content.media_type === "movie" && content.video_url && (
                <button
                  onClick={() => setPlayingUrl(content.video_url!)}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" /> Reproducir
                </button>
              )}
              {user && (
                <button
                  onClick={handleToggleList}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-md transition-colors ${
                    inMyList
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {inMyList ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                  {inMyList ? "En Mi Lista" : "Agregar a Mi Lista"}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Seasons & Episodes */}
        {content.media_type === "tv" && seasons.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Temporadas</h2>
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
              {seasons.map(([key, season]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedSeason(key); setPlayingUrl(null); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSeason === key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  Temporada {season.season_number}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              {episodes.map(([epKey, ep]) => (
                <div
                  key={epKey}
                  className="flex gap-4 bg-card rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer group"
                  onClick={() => setPlayingUrl(ep.video_url)}
                >
                  <div className="relative flex-shrink-0 w-40 md:w-52 aspect-video rounded overflow-hidden bg-muted">
                    {ep.still_path && (
                      <img src={getImageUrl(ep.still_path, "w300")} alt={ep.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-primary fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-semibold text-sm md:text-base mb-1">
                      {ep.episode_number}. {ep.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{ep.overview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related content */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-xl font-bold mb-5">
              {content.media_type === "movie" ? "Películas relacionadas" : "Series relacionadas"}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
              {related.slice(0, isMobile ? 6 : 12).map((item, i) => (
                <ContentCard key={item.docId || item.id} content={item} index={i} grid />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ContentPage;
