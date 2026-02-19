import { useState, useEffect, useRef, useCallback } from "react";

const PAGE_SIZE = 30;

export const useInfiniteScroll = <T>(items: T[], pageSize = PAGE_SIZE) => {
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visible < items.length;
  const displayed = items.slice(0, visible);

  const loadMore = useCallback(() => {
    setVisible((v) => Math.min(v + pageSize, items.length));
  }, [items.length, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Reset when items change
  useEffect(() => {
    setVisible(pageSize);
  }, [items, pageSize]);

  return { displayed, hasMore, sentinelRef };
};
