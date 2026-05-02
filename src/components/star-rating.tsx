"use client";
import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  const display = hovered ?? value ?? 0;

  return (
    <div className="star-rating" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={sizeClass}
          aria-label={`Rate ${star} out of 10`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(null)}
          onClick={() => !readonly && onChange?.(star)}
          style={{
            color: star <= display ? "var(--gold)" : "rgba(255,255,255,0.15)",
            cursor: readonly ? "default" : "pointer",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface RatingDisplayProps {
  rating: number | null;
}

export function RatingDisplay({ rating }: RatingDisplayProps) {
  if (!rating) return <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Unrated</span>;

  const stars = Math.round(rating / 2);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} style={{ color: s <= stars ? "var(--gold)" : "rgba(255,255,255,0.1)", fontSize: "0.75rem" }}>
            ★
          </span>
        ))}
      </div>
      <span style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 600 }}>{rating.toFixed(1)}</span>
    </div>
  );
}
