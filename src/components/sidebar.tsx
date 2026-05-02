"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Film,
  Tv2,
  BookOpen,
  Search,
  User,
  LogOut,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Movies", href: "/movies", icon: Film },
  { label: "TV Series", href: "/series", icon: Tv2 },
  { label: "Books", href: "/books", icon: BookOpen },
  { label: "Search", href: "/search", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(245,197,24,0.12)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[rgba(245,197,24,0.4)] animate-pulse" />
            <div className="absolute inset-1 rounded-full border border-[rgba(0,212,255,0.3)]" />
            <Zap className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
          </div>
          <div>
            <div
              className="font-orbitron text-sm font-bold leading-none"
              style={{ color: "var(--gold)", fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em" }}
            >
              HOLOCRON
            </div>
            <div
              className="text-[0.65rem] font-rajdhani tracking-widest mt-0.5"
              style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}
            >
              TRACKER
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn("nav-item", isActive && "active")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[rgba(245,197,24,0.12)]">
        {session?.user && (
          <div className="mb-3 px-3">
            <div
              className="text-xs font-rajdhani tracking-widest uppercase mb-0.5"
              style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}
            >
              Jedi Knight
            </div>
            <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session.user.name || session.user.email}
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="nav-item w-full text-left hover:text-red-400"
          style={{ color: "var(--text-secondary)", margin: "0.15rem 0" }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-[200] md:hidden p-2 rounded-lg"
        style={{ background: "rgba(7,13,26,0.9)", border: "1px solid rgba(245,197,24,0.3)" }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X className="w-5 h-5" style={{ color: "var(--gold)" }} />
        ) : (
          <Menu className="w-5 h-5" style={{ color: "var(--gold)" }} />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[150] md:hidden"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside className={cn("sidebar flex-col", mobileOpen && "open")}>
        <SidebarContent />
      </aside>
    </>
  );
}
