"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Film, Tv2, BookOpen, Filter, Star, X, Loader2 } from "lucide-react";
import { DetailModal } from "@/components/detail-modal";

interface SearchResult {
  externalId: string;
  itemType: "MOVIE" | "TV_SERIES" | "BOOK";
  title: string;
  overview?: string;
  posterUrl?: string;
  releaseYear?: number;
  genre?: string;
  language?: string;
  author?: string;
  director?: string;
  rating?: number;
  voteCount?: number;
  totalPages?: number;
  totalEpisodes?: number;
}

const TYPE_TABS = [
  { value: "MOVIE", label: "Movies", icon: Film, color: "var(--gold)" },
  { value: "TV_SERIES", label: "TV Series", icon: Tv2, color: "var(--hologram-teal)" },
  { value: "BOOK", label: "Books", icon: BookOpen, color: "#a040ff" },
] as const;

type MediaType = "MOVIE" | "TV_SERIES" | "BOOK";

const PLACEHOLDER = (title: string) =>
  `https://placehold.co/300x450/070d1a/f5c518.png?text=${encodeURIComponent(title.slice(0, 12))}`;

function SearchContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as MediaType) || "MOVIE";

  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>(initialType);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, type: MediaType) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch {
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, mediaType), 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mediaType, doSearch]);

  // Reset results on type change
  useEffect(() => {
    setResults([]);
    setHasSearched(false);
    setMinRating(0);
  }, [mediaType]);

  const filteredResults = results.filter(r => {
    if (minRating > 0 && (!r.rating || r.rating < minRating)) return false;
    return true;
  });

  const activeTab = TYPE_TABS.find(t => t.value === mediaType)!;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
            Galaxy Search
          </span>
        </div>
        <h1 className="text-3xl font-black gold-text mb-1" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.03em" }}>
          SEARCH ARCHIVE
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Find movies, series, and books from across the galaxy
        </p>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 mb-5">
        {TYPE_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = mediaType === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setMediaType(tab.value)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: "0.04em",
                background: isActive ? `${tab.color}15` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? tab.color + "50" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? tab.color : "var(--text-secondary)",
                boxShadow: isActive ? `0 0 15px ${tab.color}15` : "none",
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <div className="relative flex items-center">
          {loading ? (
            <Loader2 className="absolute left-4 w-5 h-5 animate-spin" style={{ color: activeTab.color }} />
          ) : (
            <Search className="absolute left-4 w-5 h-5" style={{ color: query ? activeTab.color : "var(--text-secondary)" }} />
          )}
          <input
            id="search-input"
            type="search"
            autoFocus
            className="sci-fi-input pl-12 pr-12 py-4 text-base"
            style={{
              borderColor: query ? `${activeTab.color}50` : undefined,
              boxShadow: query ? `0 0 20px ${activeTab.color}10` : undefined,
            }}
            placeholder={`Search ${activeTab.label.toLowerCase()} — try a title, author, or keyword...`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="absolute right-4 p-1 rounded"
              onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      {hasSearched && results.length > 0 && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              border: `1px solid ${showFilters ? activeTab.color + "50" : "rgba(255,255,255,0.1)"}`,
              color: showFilters ? activeTab.color : "var(--text-secondary)",
              background: showFilters ? `${activeTab.color}10` : "transparent",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "0.08em",
            }}
          >
            <Filter className="w-3 h-3" />
            FILTERS
          </button>

          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Min rating filter */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(7,13,26,0.6)" }}>
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>Min rating:</span>
                <select
                  className="text-xs bg-transparent outline-none"
                  style={{ color: "var(--text-primary)" }}
                  value={minRating}
                  onChange={e => setMinRating(Number(e.target.value))}
                >
                  <option value={0} style={{ background: "var(--space-navy)" }}>Any</option>
                  {[5, 6, 7, 8, 9].map(r => (
                    <option key={r} value={r} style={{ background: "var(--space-navy)" }}>≥ {r}.0</option>
                  ))}
                </select>
              </div>

              {minRating > 0 && (
                <button
                  onClick={() => setMinRating(0)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <span className="ml-auto text-xs" style={{ color: "var(--text-secondary)" }}>
            {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
            {minRating > 0 ? ` (rating ≥ ${minRating})` : ""}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {/* Empty state — not yet searched */}
      {!hasSearched && !loading && (
        <div className="empty-state holo-card" style={{ minHeight: "360px" }}>
          <div className="text-6xl mb-2 opacity-30">
            {mediaType === "MOVIE" ? "🎬" : mediaType === "TV_SERIES" ? "📺" : "📚"}
          </div>
          <h3 style={{ color: "var(--text-primary)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem", letterSpacing: "0.05em" }}>
            SEARCH THE GALAXY
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "320px", textAlign: "center" }}>
            {mediaType === "MOVIE"
              ? "Search for any movie. Powered by TMDB with full cast, runtime, and genre data."
              : mediaType === "TV_SERIES"
              ? "Search for any TV show. Get episode counts, seasons, network info, and more."
              : "Search books via Google Books. Get authors, page counts, descriptions, and covers."}
          </p>
        </div>
      )}

      {/* No results */}
      {hasSearched && !loading && filteredResults.length === 0 && (
        <div className="empty-state holo-card" style={{ minHeight: "240px" }}>
          <div className="text-4xl mb-2 opacity-30">🔭</div>
          <h3 style={{ color: "var(--text-primary)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem" }}>
            NO RESULTS FOUND
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {minRating > 0 ? "Try lowering the minimum rating filter" : `No ${activeTab.label.toLowerCase()} found for "${query}"`}
          </p>
        </div>
      )}

      {/* Results list */}
      {filteredResults.length > 0 && (
        <div className="space-y-3">
          {filteredResults.map((result, i) => (
            <button
              key={result.externalId}
              onClick={() => setSelectedItem(result)}
              className="w-full text-left rounded-xl p-4 transition-all duration-200 animate-fade-in-up group"
              style={{
                animationDelay: `${i * 0.03}s`,
                background: addedIds.has(result.externalId)
                  ? "rgba(0,230,118,0.05)"
                  : "rgba(13,27,42,0.6)",
                border: addedIds.has(result.externalId)
                  ? "1px solid rgba(0,230,118,0.25)"
                  : `1px solid rgba(255,255,255,0.06)`,
              }}
            >
              <div className="flex gap-4 items-start">
                {/* Poster */}
                <div
                  className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0"
                  style={{ background: "rgba(7,13,26,0.8)", border: `1px solid ${activeTab.color}20` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.posterUrl || PLACEHOLDER(result.title)}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="font-bold text-base group-hover:text-yellow-300 transition-colors leading-tight"
                      style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em" }}
                    >
                      {result.title}
                    </h3>
                    <div className="shrink-0">
                      {addedIds.has(result.externalId) ? (
                        <span className="badge badge-green text-[0.65rem]">✓ Added</span>
                      ) : (
                        <span
                          className="text-xs px-3 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: `${activeTab.color}15`, color: activeTab.color, border: `1px solid ${activeTab.color}30`, fontFamily: "'Orbitron', sans-serif" }}
                        >
                          VIEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {result.releaseYear && (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{result.releaseYear}</span>
                    )}
                    {result.author && (
                      <span className="text-xs" style={{ color: activeTab.color }}>by {result.author}</span>
                    )}
                    {result.genre && (
                      <span className="badge" style={{ background: `${activeTab.color}10`, color: activeTab.color, border: `1px solid ${activeTab.color}25`, fontSize: "0.6rem" }}>
                        {result.genre}
                      </span>
                    )}
                    {result.language && result.language !== "EN" && (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{result.language}</span>
                    )}
                    {result.rating && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--gold)" }}>
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {result.rating.toFixed(1)}
                        {result.voteCount && (
                          <span style={{ color: "var(--text-secondary)" }}>({(result.voteCount / 1000).toFixed(0)}k)</span>
                        )}
                      </span>
                    )}
                    {result.totalPages && (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{result.totalPages} pages</span>
                    )}
                    {result.totalEpisodes && (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{result.totalEpisodes} episodes</span>
                    )}
                  </div>

                  {result.overview && (
                    <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {result.overview}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          externalId={selectedItem.externalId}
          previewData={{
            title: selectedItem.title,
            posterUrl: selectedItem.posterUrl,
            itemType: selectedItem.itemType,
          }}
          onClose={() => setSelectedItem(null)}
          onAdded={() => setAddedIds(prev => new Set(prev).add(selectedItem.externalId))}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading-spinner" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
