import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { ContractKind, ContractStatus, Role } from "@/app/generated/prisma/client";
import { parseParisDateTime } from "@/lib/date-paris";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = session.user.role as Role;
  const userId = session.user.id;

  const where = can(role, "contracts:manage")
    ? {}
    : { OR: [{ creatorId: userId }, { targetUserId: userId }] };

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true, organization: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = session.user.role as Role;
  if (!can(role, "contracts:create")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const {
    kind, title, startDate, endDate,
    jobTitle, contractType,
    serviceDescription, deliverables,
    remunerationAmount, remunerationNote,
    notes, customFields, targetUserId,
  } = body;

  if (!kind || !title || !startDate || !targetUserId) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });

  const contract = await prisma.contract.create({
    data: {
      kind: kind as ContractKind,
      status: ContractStatus.BROUILLON,
      title,
      startDate: parseParisDateTime(startDate),
      endDate: endDate ? parseParisDateTime(endDate) : null,
      jobTitle: jobTitle || null,
      contractType: contractType || null,
      serviceDescription: serviceDescription || null,
      deliverables: deliverables || null,
      remunerationAmount: remunerationAmount ? Number(remunerationAmount) : null,
      remunerationNote: remunerationNote || null,
      notes: notes || null,
      customFields: customFields ?? [],
      creatorId: session.user.id,
      targetUserId,
    },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true, organization: true } },
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
