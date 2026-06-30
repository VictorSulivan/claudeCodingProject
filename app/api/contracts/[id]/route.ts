import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { ContractStatus, Role } from "@/app/generated/prisma/client";
import { parseParisDateTime } from "@/lib/date-paris";

async function getContractWithAccess(id: string, userId: string, role: Role) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true, organization: true } },
    },
  });
  if (!contract) return null;

  const hasAccess =
    contract.creatorId === userId ||
    contract.targetUserId === userId ||
    can(role, "contracts:manage");

  return hasAccess ? contract : false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const result = await getContractWithAccess(id, session.user.id, session.user.role as Role);

  if (result === null) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (result === false) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;
  const result = await getContractWithAccess(id, session.user.id, role);

  if (result === null) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (result === false) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const isOwner = result.creatorId === session.user.id;
  if (!isOwner && !can(role, "contracts:manage")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (result.status !== ContractStatus.BROUILLON) {
    return NextResponse.json({ error: "Seul un brouillon peut être modifié" }, { status: 409 });
  }

  const body = await req.json();
  const updated = await prisma.contract.update({
    where: { id },
    data: {
      title: body.title,
      startDate: body.startDate ? parseParisDateTime(body.startDate) : undefined,
      endDate: body.endDate ? parseParisDateTime(body.endDate) : null,
      jobTitle: body.jobTitle ?? null,
      contractType: body.contractType ?? null,
      serviceDescription: body.serviceDescription ?? null,
      deliverables: body.deliverables ?? null,
      remunerationAmount: body.remunerationAmount != null ? Number(body.remunerationAmount) : null,
      remunerationNote: body.remunerationNote ?? null,
      notes: body.notes ?? null,
      customFields: body.customFields ?? [],
    },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true, organization: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;
  const result = await getContractWithAccess(id, session.user.id, role);

  if (result === null) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (result === false) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const isOwner = result.creatorId === session.user.id;
  if (!isOwner && !can(role, "contracts:manage")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (result.status !== ContractStatus.BROUILLON) {
    return NextResponse.json({ error: "Seul un brouillon peut être supprimé" }, { status: 409 });
  }

  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
