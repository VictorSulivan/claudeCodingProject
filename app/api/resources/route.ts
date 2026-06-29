import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  const resources = await prisma.resource.findMany({
    where: eventId ? { eventId } : {},
    include: {
      entries: {
        include: { procuredBy: { select: { id: true, name: true } } },
        orderBy: { procuredAt: "desc" },
      },
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    resources.map((r) => ({
      ...r,
      quantityProcured: r.entries.reduce((sum, e) => sum + e.quantity, 0),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = session.user.role as Role;
  if (!can(role, "resources:manage")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, quantityNeeded, unit, eventId } = body;

  if (!name || !quantityNeeded) {
    return NextResponse.json({ error: "Nom et quantité requis" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: {
      name,
      description,
      quantityNeeded: Number(quantityNeeded),
      unit,
      eventId: eventId ?? null,
    },
    include: { entries: true },
  });

  return NextResponse.json({ ...resource, quantityProcured: 0 }, { status: 201 });
}
