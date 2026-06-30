import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildContractDocument } from "@/components/contracts/ContractPDFTemplate";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role as Role;
  const userId = session.user.id;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true, organization: true } },
    },
  });

  if (!contract) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const hasAccess =
    contract.creatorId === userId ||
    contract.targetUserId === userId ||
    can(role, "contracts:manage");

  if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const contractData = {
    ...contract,
    customFields: (Array.isArray(contract.customFields) ? contract.customFields : []) as Array<{ label: string; value: string }>,
  };

  const buffer = await renderToBuffer(buildContractDocument(contractData));

  const safeName = contract.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contrat-${safeName}.pdf"`,
    },
  });
}
