import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Content } from "@/types/content";
import { getBackdropUrl } from "@/lib/image";
import { contentUrl } from "@/lib/slug";

interface HeroProps {
  content: Content | null;
  allContent?: Content[];
  heroConfig?: { posters?: number; random?: number };
}

const Hero = ({ content, allContent = [], heroConfig }: HeroProps) => {
  const navigate = useNavigate();

  const totalPosters = heroConfig?.posters || 8;
  const randomCount = heroConfig?.random || 4;
  const recentCount = Math.max(0, totalPosters - randomCount);

  const slides = useMemo(() => {
    const withBackdrop = allContent.filter((c) => c.backdrop_path);
    if (withBackdrop.length === 0) {
      return content ? [content] : [];
    }

    // Get the most recent items
    const mostRecent = [...withBackdrop.slice(0, recentCount)];
    
    // Get all other items for random selection
    const others = withBackdrop.slice(recentCount);
    
    // Pick random items from the rest
    const randomItems = others.length > 0 
      ? [...others].sort(() => 0.5 - Math.random()).slice(0, randomCount)
      : [];

    // Combine and shuffle
    const combined = [...mostRecent, ...randomItems];
    return combined.sort(() => 0.5 - Math.random()).slice(0, totalPosters);
  }, [allContent, content, totalPosters, randomCount, recentCount]);

  const [current, setCurrent] = useState(0);

  const goNext = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goNext, 7000);
    return () => clearInterval(timer);
  }, [goNext, slides.length]);

  if (slides.length === 0) {
    return <div className="relative h-[70vh] md:h-[85vh] bg-muted animate-pulse" />;
  }

  const item = slides[current];
  const bgImage = getBackdropUrl(item.backdrop_path || item.poster_path);
  const year = item.release_date?.split("-")[0];
  const typeLabel = item.media_type === "movie" ? "Película" : "Serie";

  return (
    <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-12 pb-16 md:pb-24 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase bg-primary text-primary-foreground px-3 py-1 rounded-md">
                {typeLabel}
              </span>
              {item.vote_average != null && (
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400">{item.vote_average.toFixed(1)}</span>
                </span>
              )}
              {year && <span className="text-sm text-muted-foreground font-medium">{year}</span>}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-shadow leading-tight mb-4">
              {item.title}
            </h1>

            <p className="text-sm md:text-base text-foreground/70 line-clamp-3 mb-6 max-w-xl leading-relaxed">
              {item.overview}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`${contentUrl(item)}?autoplay=1`)}
                className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <Play className="w-5 h-5 fill-current" />
                Ver ahora
              </button>
              <button
                onClick={() => navigate(contentUrl(item))}
                className="flex items-center gap-2 px-7 py-3 bg-secondary/80 text-secondary-foreground font-bold rounded-lg hover:bg-accent transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <Info className="w-5 h-5" />
                Más información
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center hover:bg-background/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center hover:bg-background/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-primary w-6" : "bg-foreground/30 hover:bg-foreground/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Hero;
