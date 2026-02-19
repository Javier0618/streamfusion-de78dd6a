import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Play } from "lucide-react";
import type { Content } from "@/types/content";
import { trackPosterClick } from "@/lib/firestore";
import { getImageUrl } from "@/lib/image";
import { contentUrl } from "@/lib/slug";

interface ContentCardProps {
  content: Content;
  index?: number;
  grid?: boolean;
}

const ContentCard = ({ content, index = 0, grid = false }: ContentCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    trackPosterClick(content.docId || String(content.id));
    navigate(contentUrl(content));
  };

  const year = content.release_date?.split("-")[0];
  const typeLabel = content.media_type === "movie" ? "Película" : "Serie";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.15) }}
      onClick={handleClick}
      className={grid ? "cursor-pointer" : "flex-shrink-0 w-[150px] md:w-[180px] cursor-pointer"}
    >
      <div className="group/card relative aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-md hover:shadow-xl transition-shadow duration-300">
        <img
          src={getImageUrl(content.poster_path)}
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
          loading="lazy"
        />

        {/* Always-visible bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

        {/* Play icon on hover - scoped to this card */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Rating badge */}
        {content.vote_average != null && (
          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs font-bold">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white drop-shadow-md">{content.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              {typeLabel}
            </span>
            {year && (
              <span className="text-[10px] font-semibold text-white/80">
                {year}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
            {content.title}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;
