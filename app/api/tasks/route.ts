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
  const role = session.user.role as Role;

  const where = eventId ? { eventId } : {};

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, organization: true } },
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { title, description, status, eventId, assigneeId, dueDate } = body;

  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const role = session.user.role as Role;
  if (assigneeId && !can(role, "tasks:assign")) {
    return NextResponse.json({ error: "Droits insuffisants pour assigner" }, { status: 403 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status ?? "TODO",
      eventId: eventId ?? null,
      assigneeId: assigneeId ?? session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}
