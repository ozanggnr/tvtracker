import type { ItemType, ItemStatus, TrackedItem, User } from "@prisma/client";

export type { ItemType, ItemStatus };

export interface TrackedItemWithUser extends TrackedItem {
  user: Pick<User, "id" | "name" | "email">;
}

export interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalBooks: number;
  completed: number;
  watching: number;
  planToWatch: number;
  favorites: number;
  avgRating: number | null;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface SearchResult {
  id: string;
  title: string;
  overview?: string;
  posterUrl?: string;
  releaseYear?: number;
  itemType: ItemType;
  externalId?: string;
  author?: string;
  director?: string;
}

export type SortOrder = "asc" | "desc";
export type SortField = "title" | "rating" | "createdAt" | "updatedAt" | "releaseYear";

export interface FilterOptions {
  status?: ItemStatus;
  genre?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  search?: string;
}
