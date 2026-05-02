"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, SlidersHorizontal, Plus } from "lucide-react";
import type { TrackedItem, ItemType, ItemStatus } from "@prisma/client";
import { ItemCard } from "@/components/item-card";

interface TrackerPageProps {
  itemType: ItemType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  searchHref: string;
}

const STATUS_FILTERS: { value: ItemStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "FAVORITE", label: "Favorite" },
  { value: "READING", label: "Reading" },
  { value: "PLAN_TO_READ", label: "Plan to Read" },
];

const BOOK_FILTERS: { value: ItemStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PLAN_TO_READ", label: "Plan to Read" },
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "FAVORITE", label: "Favorite" },
];

const MOVIE_TV_FILTERS: { value: ItemStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "FAVORITE", label: "Favorite" },
];

export function TrackerPage({ itemType, title, subtitle, icon, accentColor, searchHref }: TrackerPageProps) {
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const filters = itemType === "BOOK" ? BOOK_FILTERS : MOVIE_TV_FILTERS;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ itemType, sortBy, sortOrder });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [itemType, statusFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchItems, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
              {subtitle}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
            >
              {icon}
            </div>
            <h1
              className="text-3xl font-black"
              style={{ fontFamily: "'Orbitron', sans-serif", color: accentColor, letterSpacing: "0.03em" }}
            >
              {title}
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            {items.length} item{items.length !== 1 ? "s" : ""} in your archive
          </p>
        </div>
        <Link
          href={searchHref}
          className="btn-primary flex items-center gap-2"
          style={{ borderColor: accentColor }}
        >
          <Plus className="w-4 h-4" />
          Add New
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <input
            type="search"
            className="sci-fi-input pl-10"
            placeholder={`Search your ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          <select
            className="sci-fi-select pl-9"
            style={{ width: "auto", minWidth: "160px" }}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by);
              setSortOrder(order);
            }}
          >
            <option value="updatedAt-desc" style={{ background: "var(--space-navy)" }}>Recently Updated</option>
            <option value="createdAt-desc" style={{ background: "var(--space-navy)" }}>Recently Added</option>
            <option value="title-asc" style={{ background: "var(--space-navy)" }}>Title A-Z</option>
            <option value="title-desc" style={{ background: "var(--space-navy)" }}>Title Z-A</option>
            <option value="rating-desc" style={{ background: "var(--space-navy)" }}>Highest Rated</option>
            <option value="releaseYear-desc" style={{ background: "var(--space-navy)" }}>Newest First</option>
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tab-bar overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.value}
            className={`tab-item whitespace-nowrap ${statusFilter === f.value ? "active" : ""}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <div className="loading-spinner" />
          <span style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>SCANNING ARCHIVE...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state holo-card">
          <div className="empty-state-icon">
            {itemType === "MOVIE" ? "🎬" : itemType === "TV_SERIES" ? "📺" : "📚"}
          </div>
          <h3
            style={{ color: "var(--text-primary)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem", letterSpacing: "0.05em" }}
          >
            {searchQuery || statusFilter !== "ALL" ? "NO ITEMS FOUND" : "ARCHIVE IS EMPTY"}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search or filter"
              : `Start adding ${title.toLowerCase()} to your archive`}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <Link href={searchHref} className="btn-primary mt-2" style={{ fontSize: "0.8rem", padding: "0.625rem 1.25rem" }}>
              Search & Add
            </Link>
          )}
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={fetchItems} />
          ))}
        </div>
      )}
    </div>
  );
}
