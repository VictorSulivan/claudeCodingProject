import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";
import ContractForm from "@/components/contracts/ContractForm";

export default async function NewContractPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!can(role, "contracts:create")) redirect("/dashboard/contracts");

  const allUsers = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "CONTRACTANT"] } },
    select: { id: true, name: true, role: true, organization: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Nouveau contrat" />
      <main className="flex-1 p-6">
        <div className="max-w-2xl">
          <ContractForm allUsers={allUsers} />
        </div>
      </main>
    </div>
  );
}
