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
  const publicOnly = searchParams.get("public") === "true";
  const myAgenda = searchParams.get("agenda") === "true";

  if (publicOnly) {
    const events = await prisma.event.findMany({
      where: { isPublic: true },
      include: { creator: { select: { id: true, name: true, organization: true } } },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json(events);
  }

  if (myAgenda) {
    const entries = await prisma.agendaEntry.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          include: { creator: { select: { id: true, name: true, organization: true } } },
        },
      },
      orderBy: { event: { startDate: "asc" } },
    });
    return NextResponse.json(entries.map((e) => ({ ...e.event, agendaNote: e.note })));
  }

  // Événements visibles : publics + créés par l'utilisateur + partagés avec lui
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { isPublic: true },
        { creatorId: session.user.id },
        { shares: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, organization: true } },
      _count: { select: { tasks: true, resources: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { title, description, startDate, endDate, location, isPublic } = body;

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const role = session.user.role as Role;
  if (isPublic && !can(role, "events:create:public")) {
    return NextResponse.json({ error: "Droits insuffisants pour publier sur le calendrier global" }, { status: 403 });
  }
  if (!can(role, "events:create:private")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startDate: parseParisDateTime(startDate),
      endDate: parseParisDateTime(endDate),
      location,
      isPublic: isPublic && can(role, "events:create:public"),
      creatorId: session.user.id,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
