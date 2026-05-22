"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Film, Tv2, BookOpen, Star, Edit2, Save, Loader2,
  CheckCircle2, Calendar, Trophy, DownloadCloud
} from "lucide-react";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { formatDate } from "@/lib/utils";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  traktUsername: string | null;
  lastTraktSync: string | null;
  _count: { trackedItems: number };
}

interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalBooks: number;
  completed: number;
  watching: number;
  favorites: number;
  avgRating: number | null;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [importingTrakt, setImportingTrakt] = useState(false);
  const [traktMessage, setTraktMessage] = useState("");
  const [traktError, setTraktError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  const fetchProfileData = () => {
    Promise.all([
      fetch("/api/profile").then(r => r.json()),
      fetch("/api/dashboard").then(r => r.json()),
    ]).then(([profileData, dashData]) => {
      setProfile(profileData.user);
      setStats(dashData.stats);
      reset({ name: profileData.user?.name || "", bio: profileData.user?.bio || "" });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    // Check URL for Trakt OAuth result
    const params = new URLSearchParams(window.location.search);
    const successCount = params.get("traktSuccess");
    const err = params.get("traktError");
    if (successCount) {
      setTraktMessage(`Successfully imported ${successCount} watched items from Trakt!`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (err) {
      setTraktError(err);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: UpdateProfileInput) => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Failed to save");
        return;
      }
      const updated = await res.json();
      setProfile(updated.user);
      await updateSession({ name: updated.user.name });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleTraktConnect = async () => {
    setImportingTrakt(true);
    setTraktError("");
    setTraktMessage("");
    
    if (profile?.traktUsername) {
      try {
        const res = await fetch("/api/trakt/sync", { method: "POST" });
        const data = await res.json();
        if (!res.ok || data.error) {
          setTraktError(data.error || "Failed to sync");
        } else {
          setTraktMessage(data.message || "Synced successfully!");
          fetchProfileData(); // refresh last sync date
        }
      } catch (err) {
        setTraktError("Network error during sync");
      } finally {
        setImportingTrakt(false);
      }
    } else {
      window.location.href = "/api/auth/trakt/login";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="loading-spinner" />
        <p style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em" }}>
          LOADING PROFILE...
        </p>
      </div>
    );
  }

  const initials = profile?.name
    ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
            Jedi Record
          </span>
        </div>
        <h1 className="text-3xl font-black gold-text" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.03em" }}>
          PROFILE
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Avatar & basic info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Avatar card */}
          <div className="holo-card p-6 text-center">
            <div
              className="relative w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black scanner-line"
              style={{
                background: "linear-gradient(135deg, rgba(245,197,24,0.15), rgba(0,212,255,0.1))",
                border: "2px solid rgba(245,197,24,0.4)",
                color: "var(--gold)",
                fontFamily: "'Orbitron', sans-serif",
                boxShadow: "0 0 30px rgba(245,197,24,0.15)",
              }}
            >
              {profile?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                initials
              )}
            </div>

            <h2 className="text-lg font-bold mb-0.5" style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif" }}>
              {profile?.name || "Unknown Jedi"}
            </h2>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {profile?.email}
            </p>
            {profile?.bio && (
              <p className="text-sm italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {profile.bio}
              </p>
            )}

            <div className="section-divider" />

            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {profile?.createdAt ? formatDate(profile.createdAt) : "—"}</span>
            </div>
          </div>

          {/* Total items */}
          <div className="stat-card text-center">
            <div className="text-4xl font-black mb-1 gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {profile?._count?.trackedItems || 0}
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
              Items in Archive
            </div>
          </div>

          {/* Avg rating */}
          {stats?.avgRating && (
            <div className="stat-card text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-4xl font-black gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {stats.avgRating.toFixed(1)}
                </span>
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
                Average Rating
              </div>
            </div>
          )}
        </div>

        {/* Right column — Stats & Edit */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats breakdown */}
          <div className="holo-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className="font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
                ARCHIVE STATS
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Movies", value: stats?.totalMovies, icon: Film, color: "var(--gold)" },
                { label: "TV Series", value: stats?.totalSeries, icon: Tv2, color: "var(--hologram-teal)" },
                { label: "Books", value: stats?.totalBooks, icon: BookOpen, color: "#a040ff" },
                { label: "Completed", value: stats?.completed, icon: CheckCircle2, color: "#00e676" },
                { label: "Watching", value: stats?.watching, icon: User, color: "#4080ff" },
                { label: "Favorites", value: stats?.favorites, icon: Star, color: "#ff4a8f" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="text-xl font-black" style={{ color: s.color, fontFamily: "'Orbitron', sans-serif" }}>
                        {s.value ?? 0}
                      </div>
                      <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit profile */}
          <div className="holo-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
                  EDIT PROFILE
                </h3>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary"
                  style={{ padding: "0.4rem 0.875rem", fontSize: "0.7rem" }}
                >
                  Edit
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "#00e676" }}>
                <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
              </div>
            )}

            {saveError && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}>
                {saveError}
              </div>
            )}

            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                  style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                  Display Name
                </label>
                <input
                  type="text"
                  className="sci-fi-input"
                  disabled={!editing}
                  placeholder="Your name"
                  style={{ opacity: editing ? 1 : 0.6, cursor: editing ? "text" : "default" }}
                  {...register("name")}
                />
                {errors.name && <p className="mt-1 text-xs" style={{ color: "#ff6b6b" }}>{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                  style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                  Bio
                </label>
                <textarea
                  className="sci-fi-input resize-none"
                  rows={3}
                  disabled={!editing}
                  placeholder="Tell the galaxy about yourself..."
                  style={{ opacity: editing ? 1 : 0.6, cursor: editing ? "text" : "default" }}
                  {...register("bio")}
                />
                {errors.bio && <p className="mt-1 text-xs" style={{ color: "#ff6b6b" }}>{errors.bio.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                  style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}>
                  Email (read-only)
                </label>
                <input
                  type="email"
                  className="sci-fi-input"
                  disabled
                  value={profile?.email || ""}
                  style={{ opacity: 0.5, cursor: "default" }}
                  readOnly
                />
              </div>

              {editing && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setEditing(false); reset(); }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="profile-save"
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Trakt Import */}
          <div className="holo-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <DownloadCloud className="w-4 h-4" style={{ color: "var(--hologram-teal)" }} />
              <h3 className="font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
                TRAKT.TV INTEGRATION
              </h3>
            </div>
            
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              Instantly sync your watched history from a public Trakt.tv account. Items will be added as "Completed".
            </p>

            {traktMessage && (
              <div className="mb-4 px-4 py-3 rounded-lg text-xs flex items-center gap-2"
                style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "#00e676" }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {traktMessage}
              </div>
            )}

            {traktError && (
              <div className="mb-4 px-4 py-3 rounded-lg text-xs"
                style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}>
                {traktError}
              </div>
            )}

            {profile?.traktUsername ? (
              <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)]">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">Connected as {profile.traktUsername}</p>
                    {profile.lastTraktSync && (
                      <p className="text-[0.65rem] text-[var(--text-secondary)]">
                        Last sync: {new Date(profile.lastTraktSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#00e676]" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleTraktConnect}
                    disabled={importingTrakt}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    style={{ padding: "0.6rem 1rem", fontSize: "0.75rem" }}
                  >
                    {importingTrakt ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                    Sync Now
                  </button>
                  <button
                    onClick={() => {
                       if (confirm("Disconnect Trakt account?")) {
                          // Normally we would call a disconnect endpoint. Assuming it exists or leaving as frontend mock for now.
                          alert("Disconnect feature not fully implemented in backend.");
                       }
                    }}
                    className="btn-danger flex items-center justify-center"
                    style={{ padding: "0.6rem 1rem", fontSize: "0.75rem" }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <button
                  onClick={handleTraktConnect}
                  disabled={importingTrakt}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  style={{ background: "rgba(0,212,255,0.1)", borderColor: "rgba(0,212,255,0.3)", color: "var(--hologram-teal)" }}
                >
                  {importingTrakt ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                  Connect Trakt.tv & Import
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
