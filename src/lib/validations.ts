import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const trackedItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  itemType: z.enum(["MOVIE", "TV_SERIES", "BOOK"]),
  status: z.enum([
    "PLAN_TO_WATCH",
    "WATCHING",
    "COMPLETED",
    "DROPPED",
    "FAVORITE",
    "READING",
    "PLAN_TO_READ",
  ]),
  overview: z.string().optional(),
  posterUrl: z.string().optional(),
  externalId: z.string().optional(),
  rating: z.number().min(0).max(10).optional().nullable(),
  notes: z.string().optional(),
  progress: z.number().min(0).optional().nullable(),
  totalEpisodes: z.number().optional().nullable(),
  totalPages: z.number().optional().nullable(),
  genre: z.string().optional(),
  releaseYear: z.number().optional().nullable(),
  author: z.string().optional(),
  director: z.string().optional(),
  language: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type TrackedItemInput = z.infer<typeof trackedItemSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
