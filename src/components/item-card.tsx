"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Edit2, Trash2, CheckCircle2 } from "lucide-react";
import type { TrackedItem, ItemStatus } from "@prisma/client";
import { getStatusLabel, getProgressPercent } from "@/lib/utils";
import { EditItemModal } from "./edit-item-modal";

interface ItemCardProps {
  item: TrackedItem;
  variant?: "portrait" | "landscape";
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

const PLACEHOLDER_POSTER = (title: string, landscape = false) => {
  const dimensions = landscape ? "400x225" : "300x450";
  return `https://placehold.co/${dimensions}/070d1a/f5c518.png?text=${encodeURIComponent(title.slice(0, 12))}`;
};

export function ItemCard({ item, variant = "portrait", onUpdate }: ItemCardProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [optimisticStatus, setOptimisticStatus] = useState<ItemStatus>(item.status);
  const [optimisticProgress, setOptimisticProgress] = useState<number | null>(item.progress);

  useEffect(() => {
    setOptimisticStatus(item.status);
    setOptimisticProgress(item.progress);
  }, [item]);

  const maxProgress = item.totalEpisodes ?? item.totalPages;
  const progressPercent = getProgressPercent(optimisticProgress, maxProgress);
  const isCompleted = optimisticStatus === "COMPLETED";

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (toggling) return;
    setToggling(true);

    const prevStatus = optimisticStatus;
    const prevProgress = optimisticProgress;

    // Optimistic update
    if (isCompleted) {
      setOptimisticStatus(item.itemType === "BOOK" ? "PLAN_TO_READ" : "PLAN_TO_WATCH");
      setOptimisticProgress(0);
    } else {
      setOptimisticStatus("COMPLETED");
      setOptimisticProgress(maxProgress || 1);
    }

    try {
      const res = await fetch(`/api/items/${item.id}/toggle`, { method: "POST" });
      if (!res.ok) {
        setOptimisticStatus(prevStatus);
        setOptimisticProgress(prevProgress);
      } else {
        onUpdate();
      }
    } catch {
      setOptimisticStatus(prevStatus);
      setOptimisticProgress(prevProgress);
    } finally {
      setToggling(false);
    }
  };

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

  const isLandscape = variant === "landscape";
  const imageSrc = isLandscape 
    ? (item.backdropUrl || item.posterUrl || PLACEHOLDER_POSTER(item.title, true))
    : (item.posterUrl || PLACEHOLDER_POSTER(item.title, false));

  return (
    <>
      <div className={`poster-card group relative animate-fade-in-up flex flex-col h-full bg-transparent border-none ${isLandscape ? "w-[260px] sm:w-[300px]" : "w-[140px] sm:w-[160px]"}`}>
        {/* Image container */}
        <div className={`relative w-full rounded-xl overflow-hidden mb-2 shadow-lg ring-1 ring-[rgba(255,255,255,0.1)] group-hover:ring-[var(--gold)] transition-all duration-300 ${isLandscape ? "aspect-video" : "aspect-[2/3]"}`}>
          <Image
            src={imageSrc}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={isLandscape ? "300px" : "160px"}
          />
          {/* Top gradient for badges */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[rgba(0,0,0,0.8)] to-transparent" />
          
          {/* Status badge top-left (hide on landscape to match Trakt closely) */}
          {!isLandscape && (
            <div className="absolute top-2 left-2 z-10">
               <span className={`badge ${STATUS_COLORS[optimisticStatus] || "badge-gold"} shadow-md`} style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem" }}>
                 {getStatusLabel(optimisticStatus)}
               </span>
            </div>
          )}

          {/* Action buttons on hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <button
              onClick={(e) => { e.preventDefault(); setEditing(true); }}
              className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 hover:bg-[rgba(245,197,24,0.3)] bg-[rgba(245,197,24,0.15)] ring-1 ring-[rgba(245,197,24,0.4)]"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-[var(--gold)]" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 hover:bg-red-500/30 bg-red-500/15 ring-1 ring-red-500/30"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>

          {/* Bottom gradient and progress for Landscape */}
          {isLandscape && (
            <div className="absolute bottom-0 left-0 right-0 pt-8 bg-gradient-to-t from-[rgba(0,0,0,0.9)] to-transparent z-10 flex flex-col justify-end">
              {maxProgress && optimisticProgress !== null && optimisticProgress > 0 && (
                <div className="w-full h-1 bg-black/50">
                  <div 
                    className="h-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)] transition-all duration-500" 
                    style={{ width: `${Math.max(2, progressPercent)}%` }} 
                  />
                </div>
              )}
            </div>
          )}

          {/* Progress bar overlay at bottom for Portrait */}
          {!isLandscape && !isCompleted && maxProgress && optimisticProgress !== null && optimisticProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-10">
              <div 
                className="h-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)] transition-all duration-500" 
                style={{ width: `${Math.max(2, progressPercent)}%` }} 
              />
            </div>
          )}
        </div>

        {/* Info Area below image */}
        <div className="flex items-start justify-between px-1">
          <div className="flex flex-col min-w-0 pr-2">
            <h3
              className="text-sm font-bold truncate"
              style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em" }}
              title={item.title}
            >
              {item.title}
            </h3>
            <div className="flex items-center mt-0.5">
              <span className="text-xs text-white/50 truncate">
                {item.itemType === "TV_SERIES" 
                  ? `S${item.currentSeason || 1} • E${item.currentEpisode || (optimisticStatus === 'PLAN_TO_WATCH' ? 1 : 0)}` 
                  : (item.releaseYear || item.itemType.replace("_", " "))}
              </span>
            </div>
          </div>

          {/* Toggle Checkmark - Outside image */}
          <button
            onClick={handleToggle}
            className="p-1 rounded-full transition-colors shrink-0 mt-0.5"
            title={isCompleted ? "Mark as uncompleted" : "Mark as completed"}
          >
            {toggling ? (
               <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[#a040ff] animate-spin" />
            ) : (
               <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-[#a040ff]' : 'text-white/20 hover:text-[#a040ff]'} transition-colors`} />
            )}
          </button>
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
