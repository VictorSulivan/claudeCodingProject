import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — ajouter une entrée d'approvisionnement
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: resourceId } = await params;
  const body = await req.json();
  const { quantity, location, notes, procuredAt } = body;

  if (!quantity || quantity <= 0) {
    return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });

  const entry = await prisma.resourceEntry.create({
    data: {
      resourceId,
      quantity: Number(quantity),
      procuredById: session.user.id,
      location: location ?? null,
      notes: notes ?? null,
      procuredAt: procuredAt ? new Date(procuredAt) : new Date(),
    },
    include: { procuredBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(entry, { status: 201 });
}

// DELETE — supprimer une entrée
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { entryId } = body;

  const entry = await prisma.resourceEntry.findUnique({ where: { id: entryId } });
  if (!entry) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (entry.procuredById !== session.user.id) {
    return NextResponse.json({ error: "Seul l'auteur peut supprimer" }, { status: 403 });
  }

  await prisma.resourceEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ success: true });
}
