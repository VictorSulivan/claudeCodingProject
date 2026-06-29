import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { Navbar } from "@/components/layout/Navbar";
import { ResourcePanel } from "@/components/resources/ResourcePanel";

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  const canManage = can(role, "resources:manage");

  const resources = await prisma.resource.findMany({
    include: {
      entries: {
        include: { procuredBy: { select: { id: true, name: true } } },
        orderBy: { procuredAt: "desc" },
      },
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Ressources" />
      <main className="flex-1 p-6 space-y-4">
        <p className="text-slate-500 text-sm">
          Inventaire global — toutes les ressources listées pour tous les événements.
        </p>
        <ResourcePanel resources={resources} eventId="" canManage={canManage} />
      </main>
    </div>
  );
}
