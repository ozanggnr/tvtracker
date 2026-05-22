import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const item = await prisma.trackedItem.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    if (item.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let newStatus = item.status;
    let newProgress = item.progress;

    if (item.status === "COMPLETED") {
      // Toggle back to not completed
      newStatus = item.itemType === "BOOK" ? "PLAN_TO_READ" : "PLAN_TO_WATCH";
      newProgress = 0; // Reset progress
    } else {
      // Toggle to completed
      newStatus = "COMPLETED";
      if (item.itemType === "TV_SERIES") {
         newProgress = item.totalEpisodes || item.progress || 1;
      } else if (item.itemType === "BOOK") {
         newProgress = item.totalPages || item.progress || 1;
      } else {
         newProgress = 1;
      }
    }

    const updated = await prisma.trackedItem.update({
      where: { id },
      data: { status: newStatus, progress: newProgress },
    });

    return NextResponse.json({ success: true, item: updated });

  } catch (error) {
    console.error("Toggle item error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
