import Link from "next/link";
import { Starfield } from "@/components/starfield";
import { Film, Tv2, BookOpen, Star, Shield, Zap, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "var(--space-dark)" }}>
      <Starfield />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[rgba(245,197,24,0.4)] animate-pulse" />
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="font-orbitron text-sm font-bold tracking-widest gold-text">
            HOLOCRON TRACKER
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="btn-secondary"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.75rem" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.75rem" }}
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Opening crawl effect */}
        <div className="mb-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs tracking-widest uppercase"
            style={{
              borderColor: "rgba(245,197,24,0.3)",
              background: "rgba(245,197,24,0.07)",
              color: "var(--gold)",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            A long time ago in a galaxy far, far away...
          </div>
        </div>

        <h1
          className="text-5xl md:text-7xl font-black mb-6 gold-text leading-none tracking-tight"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          HOLOCRON
          <br />
          <span className="text-4xl md:text-6xl" style={{ color: "var(--text-primary)" }}>
            TRACKER
          </span>
        </h1>

        <p
          className="text-xl md:text-2xl mb-4 max-w-2xl"
          style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", lineHeight: "1.6" }}
        >
          Your personal holocron for tracking every movie, series, and book
          across the galaxy.
        </p>

        <p
          className="text-base mb-12 max-w-xl"
          style={{ color: "rgba(136,153,170,0.8)", fontFamily: "'Inter', sans-serif" }}
        >
          Rate, review, and organize your entire media collection. Never lose track
          of what you&apos;ve watched or read again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/signup" className="btn-primary" style={{ fontSize: "0.9rem", padding: "1rem 2.5rem" }}>
            Begin Your Journey
          </Link>
          <Link href="/login" className="btn-secondary" style={{ fontSize: "0.9rem", padding: "1rem 2.5rem" }}>
            Access Archive
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full mb-16">
          {[
            {
              icon: Film,
              title: "Movies",
              desc: "Track every film you've seen or plan to watch",
              color: "var(--gold)",
              bg: "rgba(245,197,24,0.07)",
            },
            {
              icon: Tv2,
              title: "TV Series",
              desc: "Monitor episodes, seasons, and progress",
              color: "var(--hologram-teal)",
              bg: "rgba(0,212,255,0.07)",
            },
            {
              icon: BookOpen,
              title: "Books",
              desc: "Log your reading journey and favorites",
              color: "#a040ff",
              bg: "rgba(160,64,255,0.07)",
            },
          ].map((feat) => (
            <div key={feat.title} className="holo-card p-6 text-left scanner-line">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: feat.bg, border: `1px solid ${feat.color}30` }}
              >
                <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "var(--text-primary)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem", letterSpacing: "0.05em" }}
              >
                {feat.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-3 gap-8 py-8 px-12 rounded-2xl"
          style={{ border: "1px solid rgba(245,197,24,0.12)", background: "rgba(7,13,26,0.6)", backdropFilter: "blur(20px)" }}
        >
          {[
            { value: "∞", label: "Items Trackable" },
            { value: "3", label: "Media Types" },
            { value: "100%", label: "Private & Secure" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black mb-1 gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-black text-center mb-3 gold-text"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            ARMED WITH THE FORCE
          </h2>
          <p className="text-center mb-12" style={{ color: "var(--text-secondary)" }}>
            Everything you need to master your media collection
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Star,
                title: "Rate & Review",
                desc: "Give each title a rating out of 10 and add personal notes to remember your thoughts.",
              },
              {
                icon: Shield,
                title: "Fully Private",
                desc: "Your lists are completely private. Only you can see what you've watched or read.",
              },
              {
                icon: Zap,
                title: "Track Progress",
                desc: "Monitor episode counts for series and page counts for books. Never lose your place.",
              },
              {
                icon: ChevronRight,
                title: "Smart Status",
                desc: "Mark items as Watching, Completed, Dropped, Favorite, or Plan to Watch.",
              },
            ].map((feat) => (
              <div key={feat.title} className="holo-card p-6 flex gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)" }}
                >
                  <feat.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3
                    className="font-bold mb-1"
                    style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", fontSize: "1rem", letterSpacing: "0.02em" }}
                  >
                    {feat.title}
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.5" }}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-8 text-center">
        <div
          className="max-w-2xl mx-auto p-12 rounded-2xl"
          style={{ background: "rgba(7,13,26,0.8)", border: "1px solid rgba(245,197,24,0.2)", backdropFilter: "blur(20px)" }}
        >
          <h2
            className="text-3xl font-black mb-4 gold-text"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            READY TO BEGIN?
          </h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
            Join the order and start building your personal media archive today.
            Free forever.
          </p>
          <Link href="/signup" className="btn-primary" style={{ fontSize: "0.95rem", padding: "1rem 3rem" }}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-8 text-center border-t" style={{ borderColor: "rgba(245,197,24,0.1)" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
          © 2026 Holocron Tracker — Your personal media archive in the stars
        </p>
      </footer>
    </main>
  );
}
