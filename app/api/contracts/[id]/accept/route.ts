import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractStatus } from "@/app/generated/prisma/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (contract.targetUserId !== session.user.id) {
    return NextResponse.json({ error: "Seul le destinataire peut accepter ce contrat" }, { status: 403 });
  }
  if (contract.status !== ContractStatus.ENVOYE) {
    return NextResponse.json({ error: "Ce contrat n'est pas en attente d'acceptation" }, { status: 409 });
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      status: ContractStatus.ACCEPTE,
      acknowledgedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
