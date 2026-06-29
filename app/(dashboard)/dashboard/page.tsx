import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();

  const [upcomingEvents, myTasks, myAgenda] = await Promise.all([
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
    }),
    prisma.task.findMany({
      where: { assigneeId: session.user.id, status: { not: "DONE" } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.agendaEntry.count({ where: { userId: session.user.id } }),
  ]);

  const stats = [
    { label: "Événements à venir", value: upcomingEvents.length, href: "/dashboard/events", color: "blue" },
    { label: "Tâches en cours", value: myTasks.length, href: "/dashboard/tasks", color: "amber" },
    { label: "Entrées agenda", value: myAgenda, href: "/dashboard/agenda", color: "green" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Tableau de bord" />
      <main className="flex-1 p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            Bonjour, {session.user.name ?? session.user.email}
          </h3>
          <p className="text-slate-500 text-sm mt-0.5">Voici un aperçu de l&apos;activité en cours.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{s.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Prochains événements */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-800">Prochains événements</h4>
              <Link href="/dashboard/events" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-slate-400 text-sm">Aucun événement à venir.</p>
              )}
              {upcomingEvents.map((e) => (
                <Link
                  key={e.id}
                  href={`/dashboard/events/${e.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">
                      {e.startDate.toLocaleDateString("fr", { day: "2-digit" })}
                    </span>
                    <span className="text-xs text-blue-400">
                      {e.startDate.toLocaleDateString("fr", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                    <p className="text-xs text-slate-400">
                      {e.startDate.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                      {e.location && ` · ${e.location}`}
                    </p>
                    {e.isPublic && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Public</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mes tâches */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-800">Mes tâches</h4>
              <Link href="/dashboard/tasks" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
            </div>
            <div className="space-y-2">
              {myTasks.length === 0 && (
                <p className="text-slate-400 text-sm">Aucune tâche en cours.</p>
              )}
              {myTasks.map((t) => {
                const statusColors = {
                  TODO: "bg-slate-100 text-slate-600",
                  IN_PROGRESS: "bg-amber-100 text-amber-700",
                  DONE: "bg-green-100 text-green-700",
                  CANCELLED: "bg-red-100 text-red-600",
                };
                const statusLabels = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminé", CANCELLED: "Annulé" };
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
                      {statusLabels[t.status]}
                    </span>
                    <p className="text-sm text-slate-700 truncate">{t.title}</p>
                    {t.dueDate && (
                      <p className="text-xs text-slate-400 ml-auto flex-shrink-0">
                        {t.dueDate.toLocaleDateString("fr")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
