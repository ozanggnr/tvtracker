import { BookOpen } from "lucide-react";
import { TrackerPage } from "@/components/tracker-page";

export default function BooksPage() {
  return (
    <TrackerPage
      itemType="BOOK"
      title="BOOKS"
      subtitle="Reading Archive"
      icon={<BookOpen className="w-5 h-5" style={{ color: "#a040ff" }} />}
      accentColor="#a040ff"
      searchHref="/search?type=BOOK"
    />
  );
}
