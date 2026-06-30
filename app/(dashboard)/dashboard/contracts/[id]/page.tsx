import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { notFound } from "next/navigation";
import ContractDetail from "@/components/contracts/ContractDetail";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const role = session.user.role as Role;
  const userId = session.user.id;
  const canManage = can(role, "contracts:manage");

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true, organization: true } },
    },
  });

  if (!contract) notFound();

  const hasAccess =
    contract.creatorId === userId ||
    contract.targetUserId === userId ||
    canManage;

  if (!hasAccess) notFound();

  return (
    <div className="flex flex-col flex-1">
      <Navbar title={contract.title} />
      <main className="flex-1 p-6 max-w-3xl">
        <ContractDetail
          contract={JSON.parse(JSON.stringify(contract))}
          currentUserId={userId}
          canManage={canManage}
        />
      </main>
    </div>
  );
}
