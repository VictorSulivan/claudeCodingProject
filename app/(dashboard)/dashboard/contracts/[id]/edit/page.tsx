import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { can } from "@/lib/permissions";
import { Role, ContractStatus } from "@/app/generated/prisma/client";
import { notFound, redirect } from "next/navigation";
import ContractForm from "@/components/contracts/ContractForm";

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
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

  const isOwner = contract.creatorId === userId;
  if (!isOwner && !canManage) notFound();
  if (contract.status !== ContractStatus.BROUILLON) {
    redirect(`/dashboard/contracts/${id}`);
  }

  const allUsers = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "CONTRACTANT"] } },
    select: { id: true, name: true, role: true, organization: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col flex-1">
      <Navbar title={`Modifier — ${contract.title}`} />
      <main className="flex-1 p-6">
        <div className="max-w-2xl">
          <ContractForm
            allUsers={allUsers}
            initial={JSON.parse(JSON.stringify(contract))}
          />
        </div>
      </main>
    </div>
  );
}
