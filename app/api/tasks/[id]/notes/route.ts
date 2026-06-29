import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });

  const note = await prisma.taskNote.create({
    data: { taskId: id, authorId: session.user.id, content: content.trim() },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
