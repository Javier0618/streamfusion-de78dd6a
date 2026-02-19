import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useContentDetail, useContent } from "@/hooks/useContent";
import Navbar from "@/components/layout/Navbar";
import VideoPlayer from "@/components/content/VideoPlayer";
import ContentCard from "@/components/home/ContentCard";
import { Play, ArrowLeft, Star, Calendar, BookmarkPlus, BookmarkCheck, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { getBackdropUrl, getImageUrl } from "@/lib/image";
import { extractDocId } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";
import { addToMyList, removeFromMyList, fetchMyList } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";
import { getGenreName } from "@/lib/genres";

const ContentPage = () => {
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

  // Autoplay
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
  const year = content.release_date?.split("-")[0];
  const isMovie = content.media_type === "movie";
  const isSeries = content.media_type === "tv";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        {/* ═══ MOVIE LAYOUT ═══ */}
        {isMovie && (
          <>
            {/* Video Player - full width */}
            <div className="px-3 md:px-8 pt-4">
              {playingUrl ? (
                <VideoPlayer url={playingUrl} title={content.title} />
              ) : (
                <div
                  className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => content.video_url && setPlayingUrl(content.video_url)}
                  style={{
                    backgroundImage: `url(${getBackdropUrl(content.backdrop_path || content.poster_path)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-background/40" />
                  {content.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-foreground/80 flex items-center justify-center bg-background/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 md:w-9 md:h-9 text-foreground fill-current ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="px-3 md:px-8 mt-6 pb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-6">
                {/* Poster */}
                <div className="flex-shrink-0 w-40 md:w-56">
                  <img src={getImageUrl(content.poster_path)} alt={content.title} className="w-full rounded-lg shadow-xl" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-4xl font-extrabold mb-1">{content.title}</h1>
                      {content.original_title && content.original_title !== content.title && (
                        <p className="text-muted-foreground text-sm italic mb-3">"{content.original_title}"</p>
                      )}
                    </div>
                    {user && (
                      <button onClick={handleToggleList} className="p-2 hover:bg-accent rounded-md transition-colors flex-shrink-0" title={inMyList ? "En Mi Lista" : "Agregar a Mi Lista"}>
                        {inMyList ? <BookmarkCheck className="w-6 h-6 text-primary" /> : <BookmarkPlus className="w-6 h-6 text-muted-foreground" />}
                      </button>
                    )}
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {content.vote_average != null && (
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400">{content.vote_average.toFixed(1)}</span>
                      </span>
                    )}
                    {year && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border px-2.5 py-0.5 rounded-md">
                        <Calendar className="w-3.5 h-3.5" /> {year}
                      </span>
                    )}
                    <span className="text-xs font-semibold uppercase border border-border px-2.5 py-0.5 rounded-md text-muted-foreground">
                      Released
                    </span>
                  </div>

                  {/* Genres */}
                  {content.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {content.genres.map((g) => (
                        <span key={g} className="text-xs font-medium border border-border px-3 py-1.5 rounded-md text-foreground hover:bg-accent transition-colors">
                          {getGenreName(g)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sinopsis */}
                  <div className="bg-card border border-border rounded-lg p-4 mb-5">
                    <h3 className="font-bold text-sm mb-2">Sinopsis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{content.overview}</p>
                  </div>

                  {/* Play button for movie */}
                  {content.video_url && !playingUrl && (
                    <button
                      onClick={() => setPlayingUrl(content.video_url!)}
                      className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" /> Reproducir
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Related */}
              {related.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
                  <h2 className="text-xl font-bold mb-5">También podría gustarte</h2>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                    {related.slice(0, isMobile ? 6 : 12).map((item, i) => (
                      <ContentCard key={item.docId || item.id} content={item} index={i} grid />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* ═══ SERIES LAYOUT ═══ */}
        {isSeries && (
          <>
            {/* Player + Episodes side by side */}
            <div className="px-3 md:px-8 pt-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Player area */}
                <div className="flex-1 min-w-0">
                  {playingUrl ? (
                    <VideoPlayer url={playingUrl} title={content.title} />
                  ) : (
                    <div
                      className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => {
                        if (episodes.length > 0 && episodes[0][1].video_url) {
                          setPlayingUrl(episodes[0][1].video_url);
                        }
                      }}
                      style={{
                        backgroundImage: `url(${getBackdropUrl(content.backdrop_path || content.poster_path)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-background/40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-foreground/80 flex items-center justify-center bg-background/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 md:w-9 md:h-9 text-foreground fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Episodes sidebar */}
                {seasons.length > 0 && (
                  <div className="lg:w-80 xl:w-96 flex-shrink-0 bg-card border border-border rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <h3 className="font-bold text-sm mb-2">Temporadas</h3>
                      <div className="flex gap-2 flex-wrap">
                        {seasons.map(([key, season]) => (
                          <button
                            key={key}
                            onClick={() => { setSelectedSeason(key); setPlayingUrl(null); }}
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                              activeSeason === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-accent"
                            }`}
                          >
                            T{season.season_number}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Episodios ({episodes.length})</p>
                    </div>
                    <div className="max-h-[400px] lg:max-h-[calc(56.25vw*0.65-80px)] overflow-y-auto">
                      {episodes.map(([epKey, ep]) => (
                        <div
                          key={epKey}
                          onClick={() => setPlayingUrl(ep.video_url)}
                          className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors hover:bg-accent border-b border-border/50 last:border-b-0 ${
                            playingUrl === ep.video_url ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="relative flex-shrink-0 w-20 aspect-video rounded overflow-hidden bg-muted">
                            {ep.still_path ? (
                              <img src={getImageUrl(ep.still_path, "w200")} alt={ep.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-secondary flex items-center justify-center">
                                <Play className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            {playingUrl === ep.video_url && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                <Play className="w-5 h-5 text-primary fill-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-primary font-medium">Episodio {ep.episode_number}</p>
                            <p className="text-xs font-semibold text-foreground truncate">Episodio {ep.episode_number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="px-3 md:px-8 mt-6 pb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-6">
                {/* Poster */}
                <div className="flex-shrink-0 w-40 md:w-56">
                  <img src={getImageUrl(content.poster_path)} alt={content.title} className="w-full rounded-lg shadow-xl" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl md:text-4xl font-extrabold mb-1">{content.title}</h1>
                    {user && (
                      <button onClick={handleToggleList} className="p-2 hover:bg-accent rounded-md transition-colors flex-shrink-0" title={inMyList ? "En Mi Lista" : "Agregar a Mi Lista"}>
                        {inMyList ? <BookmarkCheck className="w-6 h-6 text-primary" /> : <BookmarkPlus className="w-6 h-6 text-muted-foreground" />}
                      </button>
                    )}
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {content.vote_average != null && (
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400">{content.vote_average.toFixed(1)}</span>
                      </span>
                    )}
                    {year && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border px-2.5 py-0.5 rounded-md">
                        <Calendar className="w-3.5 h-3.5" /> {year}
                      </span>
                    )}
                    {seasons.length > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border px-2.5 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5" /> {seasons.length} Temporadas
                      </span>
                    )}
                    <span className="text-xs font-semibold uppercase border border-border px-2.5 py-0.5 rounded-md text-muted-foreground">
                      Returning Series
                    </span>
                  </div>

                  {/* Genres */}
                  {content.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {content.genres.map((g) => (
                        <span key={g} className="text-xs font-medium border border-border px-3 py-1.5 rounded-md text-foreground hover:bg-accent transition-colors">
                          {getGenreName(g)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sinopsis */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">Sinopsis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{content.overview}</p>
                  </div>
                </div>
              </motion.div>

              {/* Related */}
              {related.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
                  <h2 className="text-xl font-bold mb-5">También podría gustarte</h2>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                    {related.slice(0, isMobile ? 6 : 12).map((item, i) => (
                      <ContentCard key={item.docId || item.id} content={item} index={i} grid />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContentPage;
