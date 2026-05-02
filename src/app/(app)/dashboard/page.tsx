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
  };
  series: TrackedItem[];
  movies: TrackedItem[];
  books: TrackedItem[];
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
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const fetchDashboard = () => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAdvance = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (advancingId) return;
    setAdvancingId(id);
    try {
      const res = await fetch(`/api/items/${id}/advance`, { method: "POST" });
      if (res.ok) {
        fetchDashboard(); // reload to get new episode numbers
      }
    } finally {
      setAdvancingId(null);
    }
  };

  const PLACEHOLDER = (title: string) =>
    `https://placehold.co/200x300/070d1a/f5c518.png?text=${encodeURIComponent(title.slice(0, 10))}`;

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

      {/* TV Series */}
      {data?.series && data.series.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)" }}>
                TV Series
              </h2>
              <span className="text-lg">&gt;</span>
            </div>
            <Link href="/series" className="text-xs text-[var(--gold)] hover:underline">View All</Link>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {data.series.map((item) => (
              <div key={item.id} className="relative shrink-0 w-[240px] sm:w-[280px] group" style={{ scrollSnapAlign: "start" }}>
                <div className="block relative aspect-video rounded-xl overflow-hidden mb-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Image
                    src={item.posterUrl || PLACEHOLDER(item.title)}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-transparent to-transparent" />
                  
                  {item.status === "WATCHING" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgba(255,255,255,0.2)]">
                      <div 
                        className="h-full bg-[var(--gold)]" 
                        style={{ width: `${Math.min(100, Math.max(5, ((item.currentEpisode || 1) / Math.max(item.totalEpisodes || 10, 1)) * 100))}%` }} 
                      />
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.2)]">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'WATCHING' ? 'bg-red-500' : 'bg-gray-400'}`} />
                    {item.status === 'WATCHING' ? 'Episode' : 'Start'}
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm truncate w-[180px]" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--text-primary)" }}>
                      {item.title}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      S{item.currentSeason || 1} • E{item.currentEpisode || (item.status === 'PLAN_TO_WATCH' ? 1 : 0)}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleAdvance(item.id, e)}
                    disabled={advancingId === item.id}
                    title="Mark episode as watched"
                    className="p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    {advancingId === item.id ? (
                      <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[var(--gold)] animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[var(--gold)] opacity-70 hover:opacity-100" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movies */}
      {data?.movies && data.movies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)" }}>
                Movies
              </h2>
              <span className="text-lg">&gt;</span>
            </div>
            <Link href="/movies" className="text-xs text-[var(--gold)] hover:underline">View All</Link>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {data.movies.map((item) => (
              <div key={item.id} className="relative shrink-0 w-[140px] sm:w-[160px] group" style={{ scrollSnapAlign: "start" }}>
                <div className="block relative aspect-[2/3] rounded-xl overflow-hidden mb-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Image
                    src={item.posterUrl || PLACEHOLDER(item.title)}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="160px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-transparent to-transparent" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm truncate w-[110px]" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--text-primary)" }}>
                      {item.title}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Movie
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleAdvance(item.id, e)}
                    disabled={advancingId === item.id}
                    title="Mark as completed"
                    className="p-1 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    {advancingId === item.id ? (
                      <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-[var(--gold)] animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-[var(--gold)] opacity-70 hover:opacity-100" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Books */}
      {data?.books && data.books.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)" }}>
                Books
              </h2>
              <span className="text-lg">&gt;</span>
            </div>
            <Link href="/books" className="text-xs text-[#a040ff] hover:underline">View All</Link>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {data.books.map((item) => (
              <div key={item.id} className="relative shrink-0 w-[140px] sm:w-[160px] group" style={{ scrollSnapAlign: "start" }}>
                <div className="block relative aspect-[2/3] rounded-xl overflow-hidden mb-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Image
                    src={item.posterUrl || PLACEHOLDER(item.title)}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="160px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-transparent to-transparent" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm truncate w-[110px]" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--text-primary)" }}>
                      {item.title}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {item.status === "READING" ? "Reading" : "Plan to Read"}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleAdvance(item.id, e)}
                    disabled={advancingId === item.id}
                    title="Mark as completed"
                    className="p-1 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    {advancingId === item.id ? (
                      <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-[#a040ff] animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-[#a040ff] opacity-70 hover:opacity-100" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)" }}>
            History
          </h2>
          <span className="text-lg">&gt;</span>
        </div>

        {!data?.recentItems?.length ? (
          <div className="empty-state holo-card">
            <div className="empty-state-icon">🔭</div>
            <h3 style={{ color: "var(--text-primary)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem" }}>
              YOUR HISTORY IS EMPTY
            </h3>
            <div className="flex gap-3 mt-2">
              <Link href="/search" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.625rem 1.25rem" }}>
                Search & Add
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {data.recentItems.map((item) => (
              <div
                key={item.id}
                className="relative shrink-0 w-[240px] group" 
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Image
                    src={item.posterUrl || PLACEHOLDER(item.title)}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="240px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.8)] via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 text-[0.65rem] font-bold px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.9)] text-black">
                    Today
                  </div>
                </div>
                <h3 className="font-bold text-sm truncate" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--text-primary)" }}>
                  {item.title}
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {item.itemType === "TV_SERIES" ? `S${item.currentSeason || 1} • E${item.currentEpisode || 1}` : "Completed"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
