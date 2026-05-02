import { Film } from "lucide-react";
import { TrackerPage } from "@/components/tracker-page";

export default function MoviesPage() {
  return (
    <TrackerPage
      itemType="MOVIE"
      title="MOVIES"
      subtitle="Film Archive"
      icon={<Film className="w-5 h-5" style={{ color: "var(--gold)" }} />}
      accentColor="var(--gold)"
      searchHref="/search?type=MOVIE"
    />
  );
}
