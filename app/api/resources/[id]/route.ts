import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

// PUT — mettre à jour une ressource (nom, quantité nécessaire, etc.)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = session.user.role as Role;
  if (!can(role, "resources:manage")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });

  const body = await req.json();
  if (body.quantityNeeded !== undefined && Number(body.quantityNeeded) <= 0) {
    return NextResponse.json({ error: "La quantité doit être supérieure à 0" }, { status: 400 });
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      quantityNeeded: body.quantityNeeded ? Number(body.quantityNeeded) : undefined,
      unit: body.unit,
    },
    include: {
      entries: { include: { procuredBy: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({
    ...updated,
    quantityProcured: updated.entries.reduce((s, e) => s + e.quantity, 0),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = session.user.role as Role;
  if (!can(role, "resources:manage")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });

  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
