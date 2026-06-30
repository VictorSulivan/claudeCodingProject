import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { parseParisDateTime } from "@/lib/date-paris";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, organization: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: { include: { assignee: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      resources: {
        include: {
          entries: {
            include: { procuredBy: { select: { id: true, name: true } } },
            orderBy: { procuredAt: "desc" },
          },
        },
      },
      agendaEntries: { where: { userId: session.user.id } },
    },
  });

  if (!event) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const hasAccess =
    event.isPublic ||
    event.creatorId === session.user.id ||
    event.shares.some((s) => s.userId === session.user.id);

  if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.json({
    ...event,
    inAgenda: event.agendaEntries.length > 0,
    agendaNote: event.agendaEntries[0]?.note ?? null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const role = session.user.role as Role;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = event.creatorId === session.user.id;
  if (!isOwner && !can(role, "events:delete:any")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (body.isPublic && !can(role, "events:create:public")) {
    return NextResponse.json({ error: "Droits insuffisants pour publier" }, { status: 403 });
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      startDate: body.startDate ? parseParisDateTime(body.startDate) : undefined,
      endDate: body.endDate ? parseParisDateTime(body.endDate) : undefined,
      location: body.location,
      isPublic: body.isPublic,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = event.creatorId === session.user.id;
  if (!isOwner && !can(role, "events:delete:any")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
