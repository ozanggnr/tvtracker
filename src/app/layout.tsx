import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Holocron Tracker — Your Personal Media Archive",
  description:
    "Track movies, TV series, and books in your personal Holocron. A star-wars inspired media tracker for the galaxy's most devoted fans.",
  keywords: ["media tracker", "movies", "tv series", "books", "watchlist"],
  openGraph: {
    title: "Holocron Tracker",
    description: "Your personal media archive in the stars",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
