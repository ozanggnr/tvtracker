"use client";
import { useState } from "react";
import Image from "next/image";
import { Edit2, Trash2, ExternalLink } from "lucide-react";
import type { TrackedItem } from "@prisma/client";
import { getStatusLabel, getProgressPercent } from "@/lib/utils";
import { RatingDisplay } from "./star-rating";
import { EditItemModal } from "./edit-item-modal";

interface ItemCardProps {
  item: TrackedItem;
  onUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PLAN_TO_WATCH: "badge-blue",
  WATCHING: "badge-gold",
  COMPLETED: "badge-green",
  DROPPED: "badge-red",
  FAVORITE: "badge-gold",
  READING: "badge-purple",
  PLAN_TO_READ: "badge-teal",
};

const PLACEHOLDER_POSTER = (title: string) =>
  `https://placehold.co/300x450/070d1a/f5c518.png?text=${encodeURIComponent(title.slice(0, 12))}`;

export function ItemCard({ item, onUpdate }: ItemCardProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const progress = getProgressPercent(
    item.progress,
    item.totalEpisodes ?? item.totalPages
  );

  const handleDelete = async () => {
    if (!confirm(`Remove "${item.title}" from your Holocron?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      onUpdate();
    } catch {
      alert("Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="poster-card group relative animate-fade-in-up">
        {/* Poster image */}
        <div className="relative aspect-[2/3] overflow-hidden bg-[rgba(7,13,26,0.8)]">
          <Image
            src={item.posterUrl || PLACEHOLDER_POSTER(item.title)}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 200px"
          />
          {/* Hologram overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,4,8,0.9)] via-transparent to-transparent" />
          {/* Rating badge */}
          {item.rating && (
            <div
              className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.7rem] font-bold"
              style={{ background: "rgba(245,197,24,0.2)", border: "1px solid rgba(245,197,24,0.4)", color: "var(--gold)", fontFamily: "'Orbitron', sans-serif" }}
            >
              ★ {item.rating.toFixed(1)}
            </div>
          )}
          {/* Action buttons (appear on hover) */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ background: "rgba(245,197,24,0.2)", border: "1px solid rgba(245,197,24,0.4)" }}
              title="Edit"
              aria-label={`Edit ${item.title}`}
            >
              <Edit2 className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ background: "rgba(255,64,64,0.15)", border: "1px solid rgba(255,64,64,0.3)" }}
              title="Delete"
              aria-label={`Delete ${item.title}`}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3
            className="text-sm font-semibold truncate mb-1"
            style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em" }}
            title={item.title}
          >
            {item.title}
          </h3>
          <div className="flex items-center justify-between mb-2">
            <span className={`badge ${STATUS_COLORS[item.status] || "badge-gold"}`}>
              {getStatusLabel(item.status)}
            </span>
            {item.releaseYear && (
              <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>{item.releaseYear}</span>
            )}
          </div>

          {/* Progress bar */}
          {(item.totalEpisodes || item.totalPages) && item.progress !== null && (
            <div className="mb-1.5">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                <span>{item.progress ?? 0} / {item.totalEpisodes ?? item.totalPages}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditItemModal
          item={item}
          onClose={() => setEditing(false)}
          onSave={() => { setEditing(false); onUpdate(); }}
        />
      )}
    </>
  );
}
