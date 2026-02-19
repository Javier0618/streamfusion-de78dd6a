import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "./ContentCard";
import type { Content } from "@/types/content";

interface ContentCarouselProps {
  title: string;
  items: Content[];
  viewAllLink?: string;
}

const ContentCarousel = ({ title, items, viewAllLink }: ContentCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 600;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between px-4 md:px-12 mb-4">
        <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        {viewAllLink && (
          <a href={viewAllLink} className="text-xs md:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Ver todo
          </a>
        )}
      </div>
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 px-4 md:px-12 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {items.map((item, i) => (
            <ContentCard key={item.docId || item.id} content={item} index={i} />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ContentCarousel;
