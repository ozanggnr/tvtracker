import { Tv2 } from "lucide-react";
import { TrackerPage } from "@/components/tracker-page";

export default function SeriesPage() {
  return (
    <TrackerPage
      itemType="TV_SERIES"
      title="TV SERIES"
      subtitle="Series Archive"
      icon={<Tv2 className="w-5 h-5" style={{ color: "var(--hologram-teal)" }} />}
      accentColor="var(--hologram-teal)"
      searchHref="/search?type=TV_SERIES"
    />
  );
}
