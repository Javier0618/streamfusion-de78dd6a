import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useContentDetail, useContent } from "@/hooks/useContent";
import Navbar from "@/components/layout/Navbar";
import VideoPlayer from "@/components/content/VideoPlayer";
import ContentCard from "@/components/home/ContentCard";
import { Play, Star, Calendar, BookmarkPlus, BookmarkCheck, Clock, Bookmark } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { getBackdropUrl, getImageUrl } from "@/lib/image";
import { extractDocId } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";
import { addToMyList, removeFromMyList, fetchMyList } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";
import { getGenreName } from "@/lib/genres";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
        .filter(([_, ep]) => !!ep.video_url) // Only show episodes with video_url
    : [];
  const year = content.release_date?.split("-")[0];
  const isMovie = content.media_type === "movie";
  const isSeries = content.media_type === "tv";

  const cast = (content as any).credits?.cast?.slice(0, 10) || [];
  const creators = (content as any).credits?.crew?.filter((c: any) => c.job === "Director" || c.job === "Creator" || c.job === "Executive Producer").slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* ═══ VIDEO SECTION ═══ */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Main Player Area */}
          <div className="flex-1 min-w-0">
            {playingUrl ? (
              <VideoPlayer url={playingUrl} title={content.title} />
            ) : (
              <div
                className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden cursor-pointer group shadow-2xl shadow-black/50"
                onClick={() => {
                  if (isMovie && content.video_url) {
                    setPlayingUrl(content.video_url);
                  } else if (isSeries && episodes.length > 0 && episodes[0][1].video_url) {
                    setPlayingUrl(episodes[0][1].video_url);
                  }
                }}
                style={{
                  backgroundImage: `url(${getBackdropUrl(content.backdrop_path || content.poster_path)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/80 flex items-center justify-center bg-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-current ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (Series only) */}
          {isSeries && seasons.length > 0 && (
            <div className="lg:w-[350px] xl:w-[400px] flex-shrink-0 bg-[#0a0a0a] border border-white/5 rounded-xl flex flex-col h-[auto] lg:h-[450px] xl:h-[500px]">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-bold text-sm mb-3 text-white/60">Temporadas</h3>
                <div className="flex gap-2 flex-wrap">
                  {seasons.map(([key, season]) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedSeason(key); setPlayingUrl(null); }}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                        activeSeason === key
                          ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      T{season.season_number}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-4">Episodios ({episodes.length})</p>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
                {episodes.map(([epKey, ep]) => (
                  <div
                    key={epKey}
                    onClick={() => setPlayingUrl(ep.video_url)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${
                      playingUrl === ep.video_url ? "bg-primary/20 ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0 w-24 aspect-video rounded-md overflow-hidden bg-white/5">
                      {ep.still_path ? (
                        <img src={getImageUrl(ep.still_path, "w200")} alt={ep.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white/20" />
                        </div>
                      )}
                      {playingUrl === ep.video_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/40 backdrop-blur-[2px]">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${playingUrl === ep.video_url ? "text-primary" : "text-white/40"}`}>
                        Episodio {ep.episode_number}
                      </p>
                      <p className="text-sm font-medium text-white/90 truncate">Episodio {ep.episode_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ INFO SECTION ═══ */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Poster Column */}
          <div className="w-48 md:w-64 flex-shrink-0">
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={getImageUrl(content.poster_path, "w500")} 
              alt={content.title} 
              className="w-full rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{content.title}</h1>
                <div className="flex items-center gap-4 text-white/60">
                  {content.vote_average != null && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-white">{content.vote_average.toFixed(1)}</span>
                      <span className="text-xs">(834)</span>
                    </div>
                  )}
                  {year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{year}</span>
                    </div>
                  )}
                  {isSeries && seasons.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{seasons.length} Temporadas</span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/20">
                    {isMovie ? "Released" : "Returning Series"}
                  </span>
                </div>
              </div>
              {user && (
                <button 
                  onClick={handleToggleList} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10"
                >
                  {inMyList ? <BookmarkCheck className="w-6 h-6 text-primary fill-primary" /> : <Bookmark className="w-6 h-6 text-white" />}
                </button>
              )}
            </div>

            {/* Genres */}
            {content.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {content.genres.map((g) => (
                  <span key={g} className="text-xs font-bold px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors">
                    {getGenreName(g)}
                  </span>
                ))}
              </div>
            )}

            {/* Sinopsis Box */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Sinopsis</h3>
              <p className="text-base text-white/70 leading-relaxed font-light">
                {content.overview || "No hay descripción disponible."}
              </p>
            </div>

            {/* Credits Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Creators/Directors */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                  {isMovie ? "Dirección" : "Creadores"}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {creators.length > 0 ? creators.map((person: any) => (
                    <div key={person.id} className="text-sm font-medium text-white/90">
                      {person.name}
                    </div>
                  )) : (
                    <div className="text-sm text-white/30">N/A</div>
                  )}
                </div>
              </div>

              {/* Main Cast */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                  Elenco Principal
                </h3>
                <div className="flex flex-wrap gap-3">
                  {cast.length > 0 ? cast.map((person: any) => (
                    <div key={person.id} className="group flex flex-col items-center gap-2">
                      <Avatar className="w-12 h-12 border border-white/10 group-hover:scale-110 transition-transform">
                        <AvatarImage src={getImageUrl(person.profile_path, "w200")} alt={person.name} className="object-cover" />
                        <AvatarFallback className="bg-white/5 text-[10px]">{person.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-white/40 max-w-[60px] text-center truncate">{person.name}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-white/30">N/A</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RELATED SECTION ═══ */}
        {related.length > 0 && (
          <div className="pb-20 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-black mb-8 tracking-tight">También podría gustarte</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.slice(0, isMobile ? 4 : 12).map((item, i) => (
                <ContentCard key={item.docId || item.id} content={item} index={i} grid />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentPage;
