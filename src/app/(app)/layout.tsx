import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Starfield } from "@/components/starfield";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen" style={{ background: "var(--space-dark)" }}>
      <Starfield />
      <Sidebar />
      <div className="main-content relative z-10">
        <div className="p-6 pt-16 md:p-8">{children}</div>
      </div>
    </div>
  );
}
