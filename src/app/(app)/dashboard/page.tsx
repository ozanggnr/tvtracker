"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Film, Tv2, BookOpen, Star, Eye, CheckCircle, Heart, TrendingUp, Clock } from "lucide-react";
import type { TrackedItem } from "@prisma/client";
import { getStatusLabel, getStatusColor } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalMovies: number;
    totalSeries: number;
    totalBooks: number;
    completed: number;
    watching: number;
    planToWatch: number;
    favorites: number;
    avgRating: number | null;
  };
  recentItems: TrackedItem[];
}

const STAT_CARDS = [
  {
    key: "totalMovies",
    label: "Movies",
    icon: Film,
    href: "/movies",
    color: "var(--gold)",
    bg: "rgba(245,197,24,0.08)",
    border: "rgba(245,197,24,0.2)",
  },
  {
    key: "totalSeries",
    label: "TV Series",
    icon: Tv2,
    href: "/series",
    color: "var(--hologram-teal)",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.2)",
  },
  {
    key: "totalBooks",
    label: "Books",
    icon: BookOpen,
    href: "/books",
    color: "#a040ff",
    bg: "rgba(160,64,255,0.08)",
    border: "rgba(160,64,255,0.2)",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle,
    href: "/movies",
    color: "#00e676",
    bg: "rgba(0,230,118,0.08)",
    border: "rgba(0,230,118,0.2)",
  },
  {
    key: "watching",
    label: "In Progress",
    icon: Eye,
    href: "/series",
    color: "#4080ff",
    bg: "rgba(64,128,255,0.08)",
    border: "rgba(64,128,255,0.2)",
  },
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
    href: "/movies",
    color: "#ff4a8f",
    bg: "rgba(255,74,143,0.08)",
    border: "rgba(255,74,143,0.2)",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const PLACEHOLDER = (title: string) =>
    `https://placehold.co/200x300/070d1a/f5c518?text=${encodeURIComponent(title.slice(0, 10))}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="loading-spinner" />
        <p style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em" }}>
          ACCESSING HOLOCRON...
        </p>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}
          >
            Mission Control
          </span>
        </div>
        <h1
          className="text-3xl font-black gold-text mb-1"
          style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.03em" }}
        >
          HOLOCRON DASHBOARD
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Your personal media archive at a glance</p>
      </div>

      {/* Average Rating Banner */}
      {stats?.avgRating && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-4 animate-glow-pulse"
          style={{ background: "rgba(245,197,24,0.07)", border: "1px solid rgba(245,197,24,0.2)" }}
        >
          <Star className="w-8 h-8 text-yellow-400 shrink-0" />
          <div>
            <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
              Average Rating
            </p>
            <p className="text-2xl font-black gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {stats.avgRating.toFixed(1)} / 10
            </p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {[1,2,3,4,5,6,7,8,9,10].map((s) => (
              <span key={s} style={{ color: s <= Math.round(stats.avgRating!) ? "var(--gold)" : "rgba(255,255,255,0.1)", fontSize: "1rem" }}>★</span>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid mb-8">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          const value = stats?.[card.key as keyof typeof stats] ?? 0;
          return (
            <Link
              key={card.key}
              href={card.href}
              className="stat-card block"
              style={{
                animationDelay: `${i * 0.05}s`,
                background: `linear-gradient(135deg, var(--panel-bg), ${card.bg})`,
                borderColor: card.border,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <TrendingUp className="w-4 h-4 opacity-30" style={{ color: card.color }} />
              </div>
              <div
                className="text-4xl font-black mb-1"
                style={{ color: card.color, fontFamily: "'Orbitron', sans-serif" }}
              >
                {typeof value === "number" ? value : "-"}
              </div>
              <div
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}
              >
                {card.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <h2
              className="text-base font-bold"
              style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)", letterSpacing: "0.05em" }}
            >
              RECENT ACTIVITY
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/movies" className="btn-secondary" style={{ padding: "0.4rem 0.875rem", fontSize: "0.7rem" }}>Movies</Link>
            <Link href="/series" className="btn-secondary" style={{ padding: "0.4rem 0.875rem", fontSize: "0.7rem" }}>Series</Link>
            <Link href="/books" className="btn-secondary" style={{ padding: "0.4rem 0.875rem", fontSize: "0.7rem" }}>Books</Link>
          </div>
        </div>

        {!data?.recentItems?.length ? (
          <div className="empty-state holo-card">
            <div className="empty-state-icon">🔭</div>
            <h3 style={{ color: "var(--text-primary)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem" }}>
              YOUR ARCHIVE IS EMPTY
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Start tracking movies, series, and books
            </p>
            <div className="flex gap-3 mt-2">
              <Link href="/search" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.625rem 1.25rem" }}>
                Search & Add
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.recentItems.map((item, i) => (
              <div
                key={item.id}
                className="poster-card animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-[rgba(7,13,26,0.8)]">
                  <Image
                    src={item.posterUrl || PLACEHOLDER(item.title)}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,4,8,0.9)] via-transparent to-transparent" />
                  {item.rating && (
                    <div
                      className="absolute top-2 right-2 text-[0.65rem] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(245,197,24,0.2)", border: "1px solid rgba(245,197,24,0.4)", color: "var(--gold)", fontFamily: "'Orbitron', sans-serif" }}
                    >
                      ★{item.rating.toFixed(1)}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-[0.65rem] mt-0.5 ${getStatusColor(item.status)}`}
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {getStatusLabel(item.status)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Add Movie", href: "/search?type=MOVIE", icon: Film, color: "var(--gold)" },
          { label: "Add Series", href: "/search?type=TV_SERIES", icon: Tv2, color: "var(--hologram-teal)" },
          { label: "Add Book", href: "/search?type=BOOK", icon: BookOpen, color: "#a040ff" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="holo-card p-5 flex items-center gap-4 group cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${action.color}15`, border: `1px solid ${action.color}30` }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span
                className="font-bold text-sm group-hover:text-yellow-300 transition-colors"
                style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.04em" }}
              >
                {action.label}
              </span>
              <span className="ml-auto text-lg" style={{ color: action.color, opacity: 0.6 }}>+</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
