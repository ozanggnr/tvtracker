import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ── TMDB helpers ──────────────────────────────────────────────────────────────
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG  = "https://image.tmdb.org/t/p/w500";
const TMDB_IMG_ORIG = "https://image.tmdb.org/t/p/original";

function tmdbHeaders() {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// ── Google Books helpers ──────────────────────────────────────────────────────
const GB_BASE = "https://www.googleapis.com/books/v1";

// ── Open Library fallback ─────────────────────────────────────────────────────
const OL_BASE = "https://openlibrary.org";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExternalSearchResult {
  externalId: string;
  itemType: "MOVIE" | "TV_SERIES" | "BOOK";
  title: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseYear?: number;
  genre?: string;
  language?: string;
  author?: string;
  director?: string;
  rating?: number;
  runtime?: number;
  totalEpisodes?: number;
  totalPages?: number;
  genres?: string[];
  voteCount?: number;
  popularity?: number;
}

// ── TMDB movie search ─────────────────────────────────────────────────────────
async function searchMovies(query: string): Promise<ExternalSearchResult[]> {
  const headers = tmdbHeaders();
  if (!headers) return [];

  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&page=1&language=en-US`,
    { headers, next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || []).slice(0, 20).map((m: {
    id: number; title: string; overview?: string; poster_path?: string;
    backdrop_path?: string; release_date?: string; original_language?: string;
    genre_ids?: number[]; vote_average?: number; vote_count?: number; popularity?: number;
  }) => ({
    externalId: `tmdb_movie_${m.id}`,
    itemType: "MOVIE" as const,
    title: m.title,
    overview: m.overview,
    posterUrl: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : undefined,
    backdropUrl: m.backdrop_path ? `${TMDB_IMG_ORIG}${m.backdrop_path}` : undefined,
    releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4)) : undefined,
    language: m.original_language?.toUpperCase(),
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined,
    voteCount: m.vote_count,
    popularity: m.popularity,
  }));
}

// ── TMDB TV search ────────────────────────────────────────────────────────────
async function searchTV(query: string): Promise<ExternalSearchResult[]> {
  const headers = tmdbHeaders();
  if (!headers) return [];

  const res = await fetch(
    `${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&page=1&language=en-US`,
    { headers, next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || []).slice(0, 20).map((s: {
    id: number; name: string; overview?: string; poster_path?: string;
    backdrop_path?: string; first_air_date?: string; original_language?: string;
    genre_ids?: number[]; vote_average?: number; vote_count?: number;
    popularity?: number; number_of_episodes?: number;
  }) => ({
    externalId: `tmdb_tv_${s.id}`,
    itemType: "TV_SERIES" as const,
    title: s.name,
    overview: s.overview,
    posterUrl: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : undefined,
    backdropUrl: s.backdrop_path ? `${TMDB_IMG_ORIG}${s.backdrop_path}` : undefined,
    releaseYear: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : undefined,
    language: s.original_language?.toUpperCase(),
    rating: s.vote_average ? Math.round(s.vote_average * 10) / 10 : undefined,
    voteCount: s.vote_count,
    popularity: s.popularity,
  }));
}

// ── Google Books search ───────────────────────────────────────────────────────
async function searchBooks(query: string): Promise<ExternalSearchResult[]> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = key
    ? `${GB_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=20&orderBy=newest&key=${key}`
    : `${GB_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=20&orderBy=newest`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("GB failed");
    const data = await res.json();

    return (data.items || []).map((item: {
      id: string;
      volumeInfo: {
        title: string; authors?: string[]; description?: string;
        imageLinks?: { thumbnail?: string; smallThumbnail?: string; large?: string };
        publishedDate?: string; categories?: string[]; pageCount?: number;
        language?: string; averageRating?: number; ratingsCount?: number;
        industryIdentifiers?: { type: string; identifier: string }[];
      };
    }) => {
      const v = item.volumeInfo;
      // Prefer higher-res cover; fix http→https
      let cover = (v.imageLinks?.large || v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || "")
        .replace("http://", "https://");
      // GB thumbnail zoom param hack for better quality
      if (cover.includes("zoom=1")) cover = cover.replace("zoom=1", "zoom=3");

      return {
        externalId: `gb_${item.id}`,
        itemType: "BOOK" as const,
        title: v.title,
        overview: v.description,
        posterUrl: cover || undefined,
        author: v.authors?.join(", "),
        releaseYear: v.publishedDate ? parseInt(v.publishedDate.slice(0, 4)) : undefined,
        genre: v.categories?.[0],
        genres: v.categories,
        totalPages: v.pageCount,
        language: v.language?.toUpperCase(),
        rating: v.averageRating,
        voteCount: v.ratingsCount,
      };
    });
  } catch {
    // Fallback to Open Library
    return searchBooksOpenLibrary(query);
  }
}

// ── Open Library fallback ─────────────────────────────────────────────────────
async function searchBooksOpenLibrary(query: string): Promise<ExternalSearchResult[]> {
  try {
    const res = await fetch(
      `${OL_BASE}/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,subject,cover_i,number_of_pages_median,language`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.docs || []).slice(0, 20).map((b: {
      key: string; title: string; author_name?: string[];
      first_publish_year?: number; subject?: string[];
      cover_i?: number; number_of_pages_median?: number; language?: string[];
    }) => ({
      externalId: `ol_${b.key.replace("/works/", "")}`,
      itemType: "BOOK" as const,
      title: b.title,
      author: b.author_name?.[0],
      releaseYear: b.first_publish_year,
      genre: b.subject?.[0],
      posterUrl: b.cover_i
        ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg`
        : undefined,
      totalPages: b.number_of_pages_median,
      language: b.language?.[0]?.toUpperCase(),
    }));
  } catch {
    return [];
  }
}

// ── TMDB movie detail ─────────────────────────────────────────────────────────
export async function fetchMovieDetail(tmdbId: string) {
  const headers = tmdbHeaders();
  if (!headers) return null;

  const [detailRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${tmdbId}?language=en-US`, { headers, next: { revalidate: 3600 } }),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?language=en-US`, { headers, next: { revalidate: 3600 } }),
  ]);
  if (!detailRes.ok) return null;

  const m = await detailRes.json();
  const credits = creditsRes.ok ? await creditsRes.json() : null;
  const director = credits?.crew?.find((c: { job: string; name: string }) => c.job === "Director")?.name;

  return {
    externalId: `tmdb_movie_${m.id}`,
    itemType: "MOVIE" as const,
    title: m.title,
    overview: m.overview,
    posterUrl: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : undefined,
    backdropUrl: m.backdrop_path ? `${TMDB_IMG_ORIG}${m.backdrop_path}` : undefined,
    releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4)) : undefined,
    genre: m.genres?.[0]?.name,
    genres: m.genres?.map((g: { name: string }) => g.name),
    language: m.original_language?.toUpperCase(),
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined,
    voteCount: m.vote_count,
    runtime: m.runtime,
    director,
  };
}

// ── TMDB TV detail ────────────────────────────────────────────────────────────
export async function fetchTVDetail(tmdbId: string) {
  const headers = tmdbHeaders();
  if (!headers) return null;

  const res = await fetch(
    `${TMDB_BASE}/tv/${tmdbId}?language=en-US`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const s = await res.json();

  return {
    externalId: `tmdb_tv_${s.id}`,
    itemType: "TV_SERIES" as const,
    title: s.name,
    overview: s.overview,
    posterUrl: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : undefined,
    backdropUrl: s.backdrop_path ? `${TMDB_IMG_ORIG}${s.backdrop_path}` : undefined,
    releaseYear: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : undefined,
    genre: s.genres?.[0]?.name,
    genres: s.genres?.map((g: { name: string }) => g.name),
    language: s.original_language?.toUpperCase(),
    rating: s.vote_average ? Math.round(s.vote_average * 10) / 10 : undefined,
    voteCount: s.vote_count,
    totalEpisodes: s.number_of_episodes,
    director: s.created_by?.map((c: { name: string }) => c.name).join(", "),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const type  = searchParams.get("type") || "MOVIE";

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    let results: ExternalSearchResult[] = [];

    if (type === "MOVIE")     results = await searchMovies(query);
    else if (type === "TV_SERIES") results = await searchTV(query);
    else if (type === "BOOK") results = await searchBooks(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
