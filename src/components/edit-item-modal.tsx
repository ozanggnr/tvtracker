"use client";
import { useState } from "react";
import { X, Save } from "lucide-react";
import type { TrackedItem } from "@prisma/client";
import { StarRating } from "./star-rating";

interface EditItemModalProps {
  item: TrackedItem;
  onClose: () => void;
  onSave: () => void;
}

const statusOptions = [
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "FAVORITE", label: "Favorite" },
  { value: "READING", label: "Reading" },
  { value: "PLAN_TO_READ", label: "Plan to Read" },
];

export function EditItemModal({ item, onClose, onSave }: EditItemModalProps) {
  const [form, setForm] = useState({
    status: item.status,
    rating: item.rating ?? null,
    notes: item.notes ?? "",
    progress: item.progress ?? 0,
    totalEpisodes: item.totalEpisodes ?? null,
    totalPages: item.totalPages ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }
      onSave();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in-up" style={{ maxWidth: "520px" }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(245,197,24,0.15)" }}>
          <h2 className="text-base font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--gold)", letterSpacing: "0.05em" }}>
            EDIT RECORD
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" aria-label="Close modal">
            <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif" }}>
              {item.title}
            </p>
            {item.releaseYear && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{item.releaseYear}</p>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}>
              {error}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
              Status
            </label>
            <div className="relative">
              <select
                className="sci-fi-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "var(--space-navy)" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
              Rating ({form.rating ?? 0}/10)
            </label>
            <StarRating
              value={form.rating}
              onChange={(r) => setForm({ ...form, rating: r })}
            />
          </div>

          {/* Progress */}
          {(item.itemType === "TV_SERIES" || item.itemType === "BOOK") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                  {item.itemType === "TV_SERIES" ? "Episodes Watched" : "Pages Read"}
                </label>
                <input
                  type="number"
                  min="0"
                  className="sci-fi-input"
                  value={form.progress ?? ""}
                  onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                  {item.itemType === "TV_SERIES" ? "Total Episodes" : "Total Pages"}
                </label>
                <input
                  type="number"
                  min="0"
                  className="sci-fi-input"
                  value={(item.itemType === "TV_SERIES" ? form.totalEpisodes : form.totalPages) ?? ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || null;
                    setForm({
                      ...form,
                      [item.itemType === "TV_SERIES" ? "totalEpisodes" : "totalPages"]: val,
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
              Notes
            </label>
            <textarea
              className="sci-fi-input resize-none"
              rows={3}
              placeholder="Your thoughts on this title..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
