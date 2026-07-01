import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { StatsGrid, type Stat } from "@/components/dashboard/StatsGrid";
import { UpcomingEventsList } from "@/components/dashboard/UpcomingEventsList";
import { MyTasksList } from "@/components/dashboard/MyTasksList";
import { ContractStatus } from "@/app/generated/prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();

  const [upcomingEvents, myTasks, myAgendaCount, overdueTasksCount, resourcesData, pendingContractsCount] =
    await Promise.all([
      prisma.event.findMany({
        where: {
          startDate: { gte: now },
          OR: [
            { isPublic: true },
            { creatorId: session.user.id },
            { shares: { some: { userId: session.user.id } } },
          ],
        },
        orderBy: { startDate: "asc" },
        take: 5,
        select: { id: true, title: true, startDate: true, location: true, isPublic: true },
      }),
      prisma.task.findMany({
        where: { assigneeId: session.user.id, status: { notIn: ["DONE", "CANCELLED"] } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 5,
        select: { id: true, title: true, status: true, dueDate: true },
      }),
      prisma.agendaEntry.count({ where: { userId: session.user.id } }),
      prisma.task.count({
        where: {
          assigneeId: session.user.id,
          status: { notIn: ["DONE", "CANCELLED"] },
          dueDate: { lt: now },
        },
      }),
      prisma.resource.findMany({
        select: { quantityNeeded: true, entries: { select: { quantity: true } } },
      }),
      prisma.contract.count({
        where: { targetUserId: session.user.id, status: ContractStatus.ENVOYE },
      }),
    ]);

  const resourceShortageCount = resourcesData.filter(
    (r) => r.entries.reduce((sum, e) => sum + e.quantity, 0) < r.quantityNeeded
  ).length;

  const stats: Stat[] = [
    { label: "Événements à venir", value: upcomingEvents.length, href: "/dashboard/events", variant: "default" },
    { label: "Tâches en cours", value: myTasks.length, href: "/dashboard/tasks", variant: "default" },
    {
      label: "Tâches en retard",
      value: overdueTasksCount,
      href: "/dashboard/tasks",
      variant: overdueTasksCount > 0 ? "danger" : "default",
    },
    {
      label: "Ressources à compléter",
      value: resourceShortageCount,
      href: "/dashboard/resources",
      variant: resourceShortageCount > 0 ? "warning" : "default",
    },
    {
      label: "Contrats en attente",
      value: pendingContractsCount,
      href: "/dashboard/contracts",
      variant: pendingContractsCount > 0 ? "purple" : "default",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Tableau de bord" />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            Bonjour, {session.user.name ?? session.user.email}
          </h3>
          <p className="text-slate-500 text-sm mt-0.5">
            Voici un aperçu de l&apos;activité en cours.{" "}
            {myAgendaCount > 0 && (
              <span className="text-slate-400">{myAgendaCount} entrée{myAgendaCount > 1 ? "s" : ""} dans ton agenda.</span>
            )}
          </p>
        </div>
        <StatsGrid stats={stats} />
        <div className="grid grid-cols-2 gap-6">
          <UpcomingEventsList events={upcomingEvents} />
          <MyTasksList tasks={myTasks} />
        </div>
      </main>
    </div>
  );
}
