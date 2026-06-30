import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { ContractStatus, Role } from "@/app/generated/prisma/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = contract.creatorId === session.user.id;
  if (!isOwner && !can(role, "contracts:manage")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (contract.status !== ContractStatus.BROUILLON) {
    return NextResponse.json({ error: "Ce contrat a déjà été envoyé" }, { status: 409 });
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: { status: ContractStatus.ENVOYE },
  });

  return NextResponse.json(updated);
}
