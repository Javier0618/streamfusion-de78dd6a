const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

export const getImageUrl = (path: string | undefined, size: "w200" | "w300" | "w500" | "w780" | "original" = "w500"): string => {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE}${size}/${path.replace(/^\//, "")}`;
};

export const getBackdropUrl = (path: string | undefined): string => {
  return getImageUrl(path, "original");
};
