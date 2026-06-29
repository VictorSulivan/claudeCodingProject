import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const entries = await prisma.agendaEntry.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: { creator: { select: { id: true, name: true, organization: true } } },
      },
    },
    orderBy: { event: { startDate: "asc" } },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { eventId, note } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId requis" }, { status: 400 });

  const entry = await prisma.agendaEntry.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    create: { userId: session.user.id, eventId, note },
    update: { note },
    include: { event: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
