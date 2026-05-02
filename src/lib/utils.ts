import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRating(rating: number | null | undefined): string {
  if (!rating) return "Unrated";
  return `${rating.toFixed(1)} / 10`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PLAN_TO_WATCH: "Plan to Watch",
    WATCHING: "Watching",
    COMPLETED: "Completed",
    DROPPED: "Dropped",
    FAVORITE: "Favorite",
    READING: "Reading",
    PLAN_TO_READ: "Plan to Read",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PLAN_TO_WATCH: "text-blue-400",
    WATCHING: "text-yellow-400",
    COMPLETED: "text-green-400",
    DROPPED: "text-red-400",
    FAVORITE: "text-amber-400",
    READING: "text-purple-400",
    PLAN_TO_READ: "text-cyan-400",
  };
  return colors[status] || "text-gray-400";
}

export function getProgressPercent(
  progress: number | null,
  total: number | null
): number {
  if (!progress || !total || total === 0) return 0;
  return Math.min(Math.round((progress / total) * 100), 100);
}
