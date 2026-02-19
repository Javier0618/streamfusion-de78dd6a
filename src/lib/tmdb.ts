const TMDB_API_KEY = "32e5e53999e380a0291d66fb304153fe";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

export interface TmdbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbCrew {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface TmdbCredits {
  cast: TmdbCast[];
  crew: TmdbCrew[];
}

export interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  seasons?: TmdbSeason[];
  credits?: TmdbCredits;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
  episodes?: TmdbEpisode[];
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  video_url?: string;
}

export const searchTmdb = async (query: string, language = "es-MX"): Promise<TmdbSearchResult[]> => {
  const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=${language}&query=${encodeURIComponent(query)}&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB search error");
  const data = await res.json();
  return (data.results || []).filter(
    (item: any) => item.media_type === "movie" || item.media_type === "tv"
  ) as TmdbSearchResult[];
};

export const fetchTmdbDetails = async (id: number, type: "movie" | "tv", language = "es-MX"): Promise<TmdbSearchResult> => {
  const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=${language}&append_to_response=credits`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB details error");
  const data = await res.json();
  return { ...data, media_type: type };
};

export const fetchTmdbSeasonDetails = async (seriesId: number, seasonNumber: number, language = "es-MX"): Promise<TmdbSeason> => {
  const url = `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=${language}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB season error");
  return res.json();
};
