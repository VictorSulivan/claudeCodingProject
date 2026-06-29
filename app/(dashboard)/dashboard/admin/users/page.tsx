import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { UsersAdmin } from "@/components/admin/UsersAdmin";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!can(role, "admin:access")) redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      organization: true, createdAt: true,
      _count: { select: { assignedTasks: true, createdEvents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Gestion des utilisateurs" />
      <main className="flex-1 p-6">
        <UsersAdmin users={users} currentUserId={session.user.id} />
      </main>
    </div>
  );
}
