import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;

  const slot = await prisma.agendaSlot.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = slot.ownerId === session.user.id;
  const isCreator = slot.createdById === session.user.id;
  const canWriteMaire = can(role, "agenda:maire:write");

  if (!isOwner && !isCreator && !canWriteMaire) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.agendaSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;
  const body = await req.json();

  const slot = await prisma.agendaSlot.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = slot.ownerId === session.user.id;
  const isCreator = slot.createdById === session.user.id;
  const canWriteMaire = can(role, "agenda:maire:write");

  if (!isOwner && !isCreator && !canWriteMaire) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const updated = await prisma.agendaSlot.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      eventId: body.eventId ?? null,
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      event: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(updated);
}
