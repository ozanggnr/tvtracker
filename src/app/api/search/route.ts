import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "MOVIE";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchExternalAPI(query.trim(), type);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function searchExternalAPI(query: string, type: string) {
  const TMDB_KEY = process.env.TMDB_API_KEY;
  const GOOGLE_BOOKS_KEY = process.env.GOOGLE_BOOKS_API_KEY;

  if (type === "BOOK") {
    if (GOOGLE_BOOKS_KEY) {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_KEY}&maxResults=10`
      );
      const data = await res.json();
      return (data.items || []).map((item: { id: string; volumeInfo: { title: string; description?: string; imageLinks?: { thumbnail?: string }; publishedDate?: string; authors?: string[]; categories?: string[] } }) => ({
        id: item.id,
        title: item.volumeInfo.title,
        overview: item.volumeInfo.description,
        posterUrl: item.volumeInfo.imageLinks?.thumbnail,
        releaseYear: item.volumeInfo.publishedDate
          ? parseInt(item.volumeInfo.publishedDate)
          : undefined,
        author: item.volumeInfo.authors?.join(", "),
        genre: item.volumeInfo.categories?.[0],
        itemType: "BOOK",
        externalId: `gb_${item.id}`,
      }));
    }
    // Fallback: Open Library search
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`
    );
    const data = await res.json();
    return (data.docs || []).slice(0, 10).map((book: { key: string; title: string; author_name?: string[]; first_publish_year?: number; subject?: string[]; cover_i?: number }) => ({
      id: book.key,
      title: book.title,
      author: book.author_name?.[0],
      releaseYear: book.first_publish_year,
      genre: book.subject?.[0],
      posterUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : undefined,
      itemType: "BOOK",
      externalId: `ol_${book.key}`,
    }));
  }

  if (!TMDB_KEY) {
    return [];
  }

  const endpoint = type === "TV_SERIES" ? "search/tv" : "search/movie";
  const res = await fetch(
    `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=1`
  );
  const data = await res.json();

  return (data.results || []).slice(0, 10).map((item: { id: number; title?: string; name?: string; overview?: string; poster_path?: string; release_date?: string; first_air_date?: string; genre_ids?: number[] }) => ({
    id: String(item.id),
    title: item.title || item.name,
    overview: item.overview,
    posterUrl: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : undefined,
    releaseYear: item.release_date || item.first_air_date
      ? parseInt((item.release_date || item.first_air_date)!)
      : undefined,
    itemType: type,
    externalId: `tmdb_${item.id}`,
  }));
}
