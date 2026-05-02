import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // TMDB posters and backdrops
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      // Google Books covers
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "books.googleusercontent.com",
      },
      // Open Library covers
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/**",
      },
      // Placeholder images
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      // TMDB person profiles
      {
        protocol: "https",
        hostname: "*.tmdb.org",
      },
    ],
  },
  // Needed for Railway deployment
  output: "standalone",
};

export default nextConfig;
