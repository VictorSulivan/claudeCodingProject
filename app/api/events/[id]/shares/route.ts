import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { userId } = body;
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const role = session.user.role as Role;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });

  const isOwner = event.creatorId === session.user.id;
  if (!isOwner && !can(role, "events:delete:any")) {
    return NextResponse.json({ error: "Seul le créateur peut gérer les participants" }, { status: 403 });
  }

  if (userId === event.creatorId) {
    return NextResponse.json({ error: "Le créateur est déjà participant" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const share = await prisma.eventShare.upsert({
    where: { eventId_userId: { eventId: id, userId } },
    create: { eventId: id, userId },
    update: {},
  });

  return NextResponse.json(share, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { userId } = body;
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const role = session.user.role as Role;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });

  const isOwner = event.creatorId === session.user.id;
  if (!isOwner && !can(role, "events:delete:any")) {
    return NextResponse.json({ error: "Seul le créateur peut gérer les participants" }, { status: 403 });
  }

  await prisma.eventShare.deleteMany({ where: { eventId: id, userId } });
  return NextResponse.json({ success: true });
}
