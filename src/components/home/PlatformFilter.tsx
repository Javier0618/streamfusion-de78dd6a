import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const platforms = [
  {
    id: "netflix",
    label: "Netflix",
    logo: (
      <svg viewBox="0 0 111 30" className="h-5 fill-current" aria-label="Netflix">
        <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.031-13.75L94.468 0h5.063l3.062 7.874L105.875 0h5.124l-5.937 14.28zM90.47 0h-4.594v27.25c1.5.094 3.062.156 4.594.343V0zm-8.563 26.937c-4.187-.281-8.375-.53-12.656-.625V0h4.687v22.188c2.688.062 5.375.28 7.969.405v4.344zM64.75 5.78H58.5V0H77.25v5.78h-6.188V27.97c-1.656 0-3.312.032-4.968.063l.656-22.252zM54.97 14.752c0 7.717-5.874 13.06-14.03 13.06-8.094 0-13.97-5.343-13.97-13.06C26.97 7.03 32.845 1.625 40.94 1.625c8.156 0 14.03 5.405 14.03 13.127zm-4.813.031c0-5.218-3.75-8.718-9.218-8.718-5.47 0-9.157 3.5-9.157 8.718 0 5.25 3.688 8.75 9.157 8.75 5.468 0 9.218-3.5 9.218-8.75zM18.28 6.28c-2.656 0-4.875.906-6.25 2.375V0H7.344v28c1.5-.094 3.031-.25 4.562-.375l.125-13.22c0-3.468 2.063-5.28 5.125-5.28 2.907 0 4.532 1.719 4.532 5.156V27.5c1.594-.156 3.156-.281 4.75-.375V13.25c0-4.782-2.938-6.969-8.157-6.969z" />
      </svg>
    ),
  },
  {
    id: "disney",
    label: "Disney+",
    logo: (
      <svg viewBox="0 0 80 32" className="h-6 fill-current" aria-label="Disney+">
        <text x="0" y="24" fontSize="22" fontWeight="800" fontFamily="serif" letterSpacing="-0.5">Disney+</text>
      </svg>
    ),
  },
  {
    id: "hbo",
    label: "Max",
    logo: (
      <svg viewBox="0 0 60 28" className="h-7 fill-current" aria-label="Max">
        <text x="0" y="22" fontSize="26" fontWeight="900" fontFamily="sans-serif" letterSpacing="-1">max</text>
      </svg>
    ),
  },
  {
    id: "prime",
    label: "Prime Video",
    logo: (
      <svg viewBox="0 0 120 28" className="h-5 fill-current" aria-label="Prime Video">
        <text x="0" y="16" fontSize="13" fontWeight="400" fontFamily="sans-serif" letterSpacing="0.2">prime video</text>
        <path d="M2 20 Q30 26 58 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "paramount",
    label: "Paramount+",
    logo: (
      <svg viewBox="0 0 90 36" className="h-8 fill-current" aria-label="Paramount+">
        <path d="M20 22 L27 10 L34 22Z" />
        <path d="M26 22 L33 8 L40 22Z" opacity="0.7"/>
        <circle cx="33" cy="5" r="1.2"/>
        <circle cx="27" cy="7" r="1.2"/>
        <circle cx="21" cy="10" r="1.2"/>
        <circle cx="39" cy="7" r="1.2"/>
        <circle cx="45" cy="10" r="1.2"/>
        <text x="2" y="34" fontSize="9" fontWeight="700" fontFamily="sans-serif" letterSpacing="1">PARAMOUNT+</text>
      </svg>
    ),
  },
];

interface PlatformFilterProps {
  content: { display_options?: { platforms?: string[] } }[];
  visiblePlatforms?: string[];
  platformImages?: Record<string, string>;
}

const PlatformFilter = ({ content, visiblePlatforms, platformImages }: PlatformFilterProps) => {
  const navigate = useNavigate();

  const availablePlatforms = platforms.filter((p) => {
    const hasContent = content.some((c) => c.display_options?.platforms?.includes(p.id));
    if (!hasContent) return false;
    // If visiblePlatforms is configured, only show those that are enabled
    if (visiblePlatforms && visiblePlatforms.length > 0) {
      return visiblePlatforms.includes(p.id);
    }
    return true;
  });

  if (availablePlatforms.length === 0) return null;

  return (
    <div className="w-full bg-card/60 border-y border-border/40 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2 md:gap-0 px-4 md:px-12 overflow-x-auto scrollbar-hide">
        {availablePlatforms.map((platform, i) => (
          <motion.button
            key={platform.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            onClick={() => navigate(`/category/${encodeURIComponent(platform.id)}`)}
            className="group flex items-center justify-center px-8 md:px-12 py-4 text-muted-foreground hover:text-foreground transition-all duration-300 border-r border-border/30 last:border-r-0 flex-shrink-0"
          >
            <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100">
              {platformImages?.[platform.id] ? (
                <img src={platformImages[platform.id]} alt={platform.label} className="h-6 md:h-7 object-contain" />
              ) : (
                platform.logo
              )}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PlatformFilter;
