import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackedItemSchema } from "@/lib/validations";
import type { ItemType, ItemStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("itemType") as ItemType | null;
    const status = searchParams.get("status") as ItemStatus | null;
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") as "title" | "rating" | "createdAt" | "updatedAt" | "releaseYear") || "updatedAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const where: Record<string, unknown> = { userId: session.user.id };
    if (itemType) where.itemType = itemType;
    if (status) where.status = status;
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const items = await prisma.trackedItem.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = trackedItemSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check if already tracked
    if (data.externalId) {
      const existing = await prisma.trackedItem.findFirst({
        where: {
          userId: session.user.id,
          externalId: data.externalId,
          itemType: data.itemType,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This item is already in your tracker" },
          { status: 409 }
        );
      }
    }

    const item = await prisma.trackedItem.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
