"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X, Star, Clock, Calendar, Globe, Users, BookOpen,
  Tv2, Film, Loader2, Check, Plus, ChevronDown,
} from "lucide-react";
import { StarRating } from "./star-rating";

interface MediaDetail {
  externalId: string;
  itemType: "MOVIE" | "TV_SERIES" | "BOOK";
  title: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseYear?: number;
  releaseDate?: string;
  genre?: string;
  genres?: string[];
  language?: string;
  rating?: number;
  voteCount?: number;
  runtime?: number;
  totalEpisodes?: number;
  totalSeasons?: number;
  totalPages?: number;
  director?: string;
  author?: string;
  cast?: { name: string; character?: string; profileUrl?: string | null }[];
  trailerKey?: string;
  tagline?: string;
  status?: string;
  publisher?: string;
  isbn?: string;
  networks?: string[];
  episodeRuntime?: number;
  subtitle?: string;
}

interface DetailModalProps {
  externalId: string;
  previewData?: {
    title: string;
    posterUrl?: string;
    itemType: string;
  };
  onClose: () => void;
  onAdded: () => void;
}

const STATUS_OPTIONS = {
  MOVIE: [
    { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
    { value: "WATCHING", label: "Watching" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DROPPED", label: "Dropped" },
    { value: "FAVORITE", label: "Favorite" },
  ],
  TV_SERIES: [
    { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
    { value: "WATCHING", label: "Watching" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DROPPED", label: "Dropped" },
    { value: "FAVORITE", label: "Favorite" },
  ],
  BOOK: [
    { value: "PLAN_TO_READ", label: "Plan to Read" },
    { value: "READING", label: "Reading" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DROPPED", label: "Dropped" },
    { value: "FAVORITE", label: "Favorite" },
  ],
};

const TYPE_ICON = {
  MOVIE: Film,
  TV_SERIES: Tv2,
  BOOK: BookOpen,
};

const TYPE_COLOR = {
  MOVIE: "var(--gold)",
  TV_SERIES: "var(--hologram-teal)",
  BOOK: "#a040ff",
};

export function DetailModal({ externalId, previewData, onClose, onAdded }: DetailModalProps) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Form state
  const itemType = (detail?.itemType || previewData?.itemType || "MOVIE") as "MOVIE" | "TV_SERIES" | "BOOK";
  const defaultStatus = itemType === "BOOK" ? "PLAN_TO_READ" : "PLAN_TO_WATCH";
  const [status, setStatus] = useState(defaultStatus);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/detail?id=${encodeURIComponent(externalId)}`);
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || "Failed to load details");
          return;
        }
        const data = await res.json();
        setDetail(data.detail);
        // Set default status based on type
        const type = data.detail.itemType;
        setStatus(type === "BOOK" ? "PLAN_TO_READ" : "PLAN_TO_WATCH");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [externalId]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: detail.title,
          itemType: detail.itemType,
          status,
          overview: detail.overview,
          posterUrl: detail.posterUrl,
          externalId: detail.externalId,
          releaseYear: detail.releaseYear,
          genre: detail.genre,
          language: detail.language,
          author: detail.author,
          director: detail.director,
          totalEpisodes: detail.totalEpisodes,
          totalPages: detail.totalPages,
          rating: userRating,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Failed to save");
        return;
      }

      setSaved(true);
      onAdded();
      setTimeout(onClose, 1200);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const accentColor = detail ? TYPE_COLOR[detail.itemType] : TYPE_COLOR["MOVIE"];
  const Icon = detail ? TYPE_ICON[detail.itemType] : Film;

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content animate-fade-in-up relative"
        style={{ maxWidth: "700px", maxHeight: "90vh" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full transition-all"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
          aria-label="Close"
        >
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            {previewData?.posterUrl && (
              <div className="relative w-24 h-36 rounded-lg overflow-hidden opacity-40">
                <Image src={previewData.posterUrl} alt="" fill className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="loading-spinner" />
            <p style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em" }}>
              SCANNING DATABANKS...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p style={{ color: "#ff6b6b", fontFamily: "'Orbitron', sans-serif", fontSize: "0.85rem" }}>{error}</p>
            <button onClick={onClose} className="btn-secondary mt-6">Close</button>
          </div>
        )}

        {/* Content */}
        {!loading && detail && (
          <>
            {/* Backdrop */}
            {detail.backdropUrl && (
              <div className="relative h-44 overflow-hidden rounded-t-2xl">
                <Image
                  src={detail.backdropUrl}
                  alt={detail.title}
                  fill
                  className="object-cover"
                  sizes="700px"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(7,13,26,0.5)] to-[rgba(7,13,26,0.95)]" />
                {/* Type badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className="badge"
                    style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40`, fontFamily: "'Orbitron', sans-serif" }}
                  >
                    <Icon className="w-3 h-3" />
                    {detail.itemType.replace("_", " ")}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Header row */}
              <div className="flex gap-5 mb-6">
                {/* Poster */}
                <div className="relative w-28 h-40 rounded-xl overflow-hidden shrink-0 shadow-2xl"
                  style={{ border: `1px solid ${accentColor}30`, boxShadow: `0 0 20px ${accentColor}15` }}>
                  <Image
                    src={detail.posterUrl || `https://placehold.co/300x450/070d1a/f5c518?text=${encodeURIComponent(detail.title.slice(0, 10))}`}
                    alt={detail.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-xl font-black mb-1 leading-tight"
                    style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em" }}
                  >
                    {detail.title}
                  </h2>
                  {detail.subtitle && (
                    <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{detail.subtitle}</p>
                  )}
                  {detail.tagline && (
                    <p className="text-xs italic mb-3" style={{ color: accentColor, opacity: 0.8 }}>"{detail.tagline}"</p>
                  )}

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {detail.releaseYear && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Calendar className="w-3 h-3" />{detail.releaseYear}
                      </span>
                    )}
                    {detail.runtime && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Clock className="w-3 h-3" />{Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m
                      </span>
                    )}
                    {detail.episodeRuntime && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Clock className="w-3 h-3" />{detail.episodeRuntime}m/ep
                      </span>
                    )}
                    {detail.totalEpisodes && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Tv2 className="w-3 h-3" />{detail.totalEpisodes} eps
                        {detail.totalSeasons ? ` · ${detail.totalSeasons} seasons` : ""}
                      </span>
                    )}
                    {detail.totalPages && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <BookOpen className="w-3 h-3" />{detail.totalPages} pages
                      </span>
                    )}
                    {detail.language && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Globe className="w-3 h-3" />{detail.language}
                      </span>
                    )}
                  </div>

                  {/* Community rating */}
                  {detail.rating && (
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold" style={{ color: "var(--gold)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem" }}>
                        {detail.rating.toFixed(1)}
                      </span>
                      {detail.voteCount && (
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                          ({detail.voteCount.toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Genres */}
                  {detail.genres && detail.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {detail.genres.map((g) => (
                        <span key={g} className="badge" style={{ background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}25`, fontSize: "0.6rem" }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Credits */}
              {(detail.director || detail.author) && (
                <div className="mb-4 flex flex-wrap gap-4">
                  {detail.director && (
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                        {detail.itemType === "TV_SERIES" ? "Created By" : "Director"}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{detail.director}</p>
                    </div>
                  )}
                  {detail.author && (
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>Author</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{detail.author}</p>
                    </div>
                  )}
                  {detail.networks && detail.networks.length > 0 && (
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>Network</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{detail.networks.join(", ")}</p>
                    </div>
                  )}
                  {detail.publisher && (
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>Publisher</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{detail.publisher}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Overview */}
              {detail.overview && (
                <div className="mb-5">
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>Synopsis</p>
                  <p className="text-sm leading-relaxed line-clamp-4" style={{ color: "var(--text-secondary)" }}>
                    {detail.overview}
                  </p>
                </div>
              )}

              {/* Cast */}
              {detail.cast && detail.cast.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                    <Users className="w-3 h-3" /> Cast
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {detail.cast.map((c) => (
                      <div key={c.name} className="flex-shrink-0 text-center w-16">
                        <div className="w-12 h-12 mx-auto rounded-full overflow-hidden mb-1"
                          style={{ border: `1px solid ${accentColor}30`, background: "rgba(7,13,26,0.8)" }}>
                          {c.profileUrl ? (
                            <Image src={c.profileUrl} alt={c.name} width={48} height={48} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                          )}
                        </div>
                        <p className="text-[0.6rem] font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                        {c.character && (
                          <p className="text-[0.55rem] truncate" style={{ color: "var(--text-secondary)" }}>{c.character}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="section-divider" />

              {/* Save form */}
              {saveError && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}>
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                    Status
                  </label>
                  <div className="relative">
                    <select
                      className="sci-fi-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS[detail.itemType].map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ background: "var(--space-navy)" }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-secondary)" }} />
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                    Your Rating ({userRating ?? 0}/10)
                  </label>
                  <StarRating
                    value={userRating}
                    onChange={setUserRating}
                    size="sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                  Notes (optional)
                </label>
                <textarea
                  className="sci-fi-input resize-none"
                  rows={2}
                  placeholder="Add your thoughts..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  style={saved ? { background: "linear-gradient(135deg, #00aa44, #00e676)", color: "#000" } : {}}
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : saved ? (
                    <><Check className="w-4 h-4" /> Added to Archive!</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add to Holocron</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
