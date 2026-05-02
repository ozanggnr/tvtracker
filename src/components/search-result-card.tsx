"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus, Check, Loader2 } from "lucide-react";
import type { ItemType } from "@prisma/client";
import type { SearchResult } from "@/types";

interface SearchResultCardProps {
  result: SearchResult;
  isTracked: boolean;
  onAdd: () => void;
}

const PLACEHOLDER = (title: string) =>
  `https://placehold.co/300x450/070d1a/f5c518?text=${encodeURIComponent(title.slice(0, 10))}`;

const DEFAULT_STATUS: Record<ItemType, string> = {
  MOVIE: "PLAN_TO_WATCH",
  TV_SERIES: "PLAN_TO_WATCH",
  BOOK: "PLAN_TO_READ",
};

export function SearchResultCard({ result, isTracked, onAdd }: SearchResultCardProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(isTracked);

  const handleAdd = async () => {
    if (added) return;
    setAdding(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          itemType: result.itemType,
          status: DEFAULT_STATUS[result.itemType as ItemType] || "PLAN_TO_WATCH",
          overview: result.overview,
          posterUrl: result.posterUrl,
          externalId: result.externalId,
          releaseYear: result.releaseYear,
          author: result.author,
          director: result.director,
          genre: result.genre,
        }),
      });
      if (res.ok) {
        setAdded(true);
        onAdd();
      }
    } catch {
      // silent fail
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/[0.03]" style={{ border: "1px solid rgba(245,197,24,0.1)" }}>
      <div className="relative w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-[rgba(7,13,26,0.8)]">
        <Image
          src={result.posterUrl || PLACEHOLDER(result.title)}
          alt={result.title}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em" }}>
          {result.title}
        </h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {result.releaseYear && (
            <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{result.releaseYear}</span>
          )}
          {result.author && (
            <span style={{ color: "var(--hologram-teal)", fontSize: "0.75rem" }}>by {result.author}</span>
          )}
          {result.genre && (
            <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>{result.genre}</span>
          )}
        </div>
        {result.overview && (
          <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
            {result.overview}
          </p>
        )}
      </div>
      <div className="shrink-0">
        <button
          onClick={handleAdd}
          disabled={adding || added}
          className={added ? "btn-secondary" : "btn-primary"}
          style={{ minWidth: "80px", opacity: added ? 0.7 : 1 }}
          aria-label={added ? "Already added" : `Add ${result.title}`}
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : added ? (
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Added</span>
          ) : (
            <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</span>
          )}
        </button>
      </div>
    </div>
  );
}
