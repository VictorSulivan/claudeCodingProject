import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { parseParisDateTime } from "@/lib/date-paris";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId") ?? session.user.id;
  const role = session.user.role as Role;

  // Pour voir l'agenda d'un autre utilisateur il faut agenda:maire:view
  if (ownerId !== session.user.id && !can(role, "agenda:maire:view")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const slots = await prisma.agendaSlot.findMany({
    where: { ownerId },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      event: { select: { id: true, title: true } },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { title, description, location, startAt, endAt, eventId, ownerId } = body;
  const role = session.user.role as Role;

  if (!title?.trim() || !startAt || !endAt) {
    return NextResponse.json({ error: "Titre, début et fin sont requis" }, { status: 400 });
  }

  const parsedStart = parseParisDateTime(startAt);
  const parsedEnd = parseParisDateTime(endAt);
  if (parsedEnd <= parsedStart) {
    return NextResponse.json({ error: "La fin doit être après le début" }, { status: 400 });
  }

  const targetOwner = ownerId ?? session.user.id;

  // Créer un créneau sur l'agenda d'un autre nécessite agenda:maire:write
  if (targetOwner !== session.user.id && !can(role, "agenda:maire:write")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const slot = await prisma.agendaSlot.create({
    data: {
      title: title.trim(),
      description: description || null,
      location: location || null,
      startAt: parsedStart,
      endAt: parsedEnd,
      ownerId: targetOwner,
      createdById: session.user.id,
      eventId: eventId || null,
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      event: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(slot, { status: 201 });
}
