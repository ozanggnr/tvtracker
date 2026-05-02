import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_IMG_ORIG = "https://image.tmdb.org/t/p/original";
const GB_BASE = "https://www.googleapis.com/books/v1";

function tmdbHeaders() {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const externalId = searchParams.get("id") || "";

    if (!externalId) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // ── TMDB Movie ────────────────────────────────────────────────────────────
    if (externalId.startsWith("tmdb_movie_")) {
      const tmdbId = externalId.replace("tmdb_movie_", "");
      const headers = tmdbHeaders();
      if (!headers) return NextResponse.json({ error: "TMDB not configured" }, { status: 503 });

      const [detailRes, creditsRes, videosRes] = await Promise.all([
        fetch(`${TMDB_BASE}/movie/${tmdbId}?language=en-US&append_to_response=keywords`, { headers, next: { revalidate: 3600 } }),
        fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?language=en-US`, { headers, next: { revalidate: 3600 } }),
        fetch(`${TMDB_BASE}/movie/${tmdbId}/videos?language=en-US`, { headers, next: { revalidate: 3600 } }),
      ]);

      if (!detailRes.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const m = await detailRes.json();
      const credits = creditsRes.ok ? await creditsRes.json() : null;
      const videos = videosRes.ok ? await videosRes.json() : null;

      const director = credits?.crew?.find((c: { job: string; name: string }) => c.job === "Director")?.name;
      const cast = credits?.cast?.slice(0, 8).map((c: { name: string; character: string; profile_path?: string }) => ({
        name: c.name,
        character: c.character,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));
      const trailer = videos?.results?.find((v: { type: string; site: string; key: string }) => v.type === "Trailer" && v.site === "YouTube");

      return NextResponse.json({
        detail: {
          externalId,
          itemType: "MOVIE",
          title: m.title,
          overview: m.overview,
          posterUrl: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
          backdropUrl: m.backdrop_path ? `${TMDB_IMG_ORIG}${m.backdrop_path}` : null,
          releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
          releaseDate: m.release_date,
          genre: m.genres?.[0]?.name,
          genres: m.genres?.map((g: { name: string }) => g.name) || [],
          language: m.original_language?.toUpperCase(),
          rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
          voteCount: m.vote_count,
          runtime: m.runtime,
          director,
          cast,
          trailerKey: trailer?.key,
          tagline: m.tagline,
          status: m.status,
          budget: m.budget,
          revenue: m.revenue,
          imdbId: m.imdb_id,
        },
      });
    }

    // ── TMDB TV ───────────────────────────────────────────────────────────────
    if (externalId.startsWith("tmdb_tv_")) {
      const tmdbId = externalId.replace("tmdb_tv_", "");
      const headers = tmdbHeaders();
      if (!headers) return NextResponse.json({ error: "TMDB not configured" }, { status: 503 });

      const [detailRes, creditsRes] = await Promise.all([
        fetch(`${TMDB_BASE}/tv/${tmdbId}?language=en-US`, { headers, next: { revalidate: 3600 } }),
        fetch(`${TMDB_BASE}/tv/${tmdbId}/aggregate_credits?language=en-US`, { headers, next: { revalidate: 3600 } }),
      ]);

      if (!detailRes.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const s = await detailRes.json();
      const credits = creditsRes.ok ? await creditsRes.json() : null;
      const cast = credits?.cast?.slice(0, 8).map((c: { name: string; roles?: { character: string }[]; profile_path?: string }) => ({
        name: c.name,
        character: c.roles?.[0]?.character,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

      return NextResponse.json({
        detail: {
          externalId,
          itemType: "TV_SERIES",
          title: s.name,
          overview: s.overview,
          posterUrl: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
          backdropUrl: s.backdrop_path ? `${TMDB_IMG_ORIG}${s.backdrop_path}` : null,
          releaseYear: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : null,
          releaseDate: s.first_air_date,
          genre: s.genres?.[0]?.name,
          genres: s.genres?.map((g: { name: string }) => g.name) || [],
          language: s.original_language?.toUpperCase(),
          rating: s.vote_average ? Math.round(s.vote_average * 10) / 10 : null,
          voteCount: s.vote_count,
          totalEpisodes: s.number_of_episodes,
          totalSeasons: s.number_of_seasons,
          director: s.created_by?.map((c: { name: string }) => c.name).join(", "),
          cast,
          status: s.status,
          tagline: s.tagline,
          networks: s.networks?.map((n: { name: string }) => n.name),
          episodeRuntime: s.episode_run_time?.[0],
        },
      });
    }

    // ── Google Books ──────────────────────────────────────────────────────────
    if (externalId.startsWith("gb_")) {
      const gbId = externalId.replace("gb_", "");
      const key = process.env.GOOGLE_BOOKS_API_KEY;
      const url = key
        ? `${GB_BASE}/volumes/${gbId}?key=${key}`
        : `${GB_BASE}/volumes/${gbId}`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const item = await res.json();
      const v = item.volumeInfo;

      let cover = (v.imageLinks?.large || v.imageLinks?.extraLarge || v.imageLinks?.thumbnail || "")
        .replace("http://", "https://");
      if (cover.includes("zoom=1")) cover = cover.replace("zoom=1", "zoom=3");

      const isbn = v.industryIdentifiers?.find((i: { type: string }) => i.type === "ISBN_13")?.identifier
        || v.industryIdentifiers?.find((i: { type: string }) => i.type === "ISBN_10")?.identifier;

      return NextResponse.json({
        detail: {
          externalId,
          itemType: "BOOK",
          title: v.title,
          overview: v.description,
          posterUrl: cover || null,
          author: v.authors?.join(", "),
          releaseYear: v.publishedDate ? parseInt(v.publishedDate.slice(0, 4)) : null,
          releaseDate: v.publishedDate,
          genre: v.categories?.[0],
          genres: v.categories || [],
          totalPages: v.pageCount,
          language: v.language?.toUpperCase(),
          rating: v.averageRating,
          voteCount: v.ratingsCount,
          publisher: v.publisher,
          isbn,
          subtitle: v.subtitle,
          maturityRating: v.maturityRating,
        },
      });
    }

    // ── Open Library ──────────────────────────────────────────────────────────
    if (externalId.startsWith("ol_")) {
      const olId = externalId.replace("ol_", "");
      const res = await fetch(`https://openlibrary.org/works/${olId}.json`, { next: { revalidate: 3600 } });
      if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const b = await res.json();

      const coverId = b.covers?.[0];
      const authorKeys = b.authors?.map((a: { author: { key: string } }) => a.author?.key).filter(Boolean) || [];
      let authorName: string | undefined;
      if (authorKeys.length > 0) {
        try {
          const authorRes = await fetch(`https://openlibrary.org${authorKeys[0]}.json`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            authorName = authorData.name;
          }
        } catch {}
      }

      return NextResponse.json({
        detail: {
          externalId,
          itemType: "BOOK",
          title: b.title,
          overview: typeof b.description === "string" ? b.description : b.description?.value,
          posterUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
          author: authorName,
          genre: b.subjects?.[0],
          genres: b.subjects?.slice(0, 5) || [],
        },
      });
    }

    return NextResponse.json({ error: "Unknown external ID format" }, { status: 400 });
  } catch (error) {
    console.error("Detail error:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
