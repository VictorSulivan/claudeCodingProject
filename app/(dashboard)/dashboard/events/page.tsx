import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { Prisma } from "@/app/generated/prisma/client";
import Link from "next/link";

type EventWithMeta = Prisma.EventGetPayload<{
  include: {
    creator: { select: { id: true; name: true; organization: true } };
    _count: { select: { tasks: true; resources: true; shares: true } };
  };
}>;

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { isPublic: true },
        { creatorId: session.user.id },
        { shares: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, organization: true } },
      _count: { select: { tasks: true, resources: true, shares: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const role = session.user.role as Role;
  const canCreate = can(role, "events:create:private");

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.startDate) >= now);
  const past = events.filter((e) => new Date(e.startDate) < now);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Événements" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">{events.length} événement(s) visible(s)</p>
          {canCreate && (
            <Link
              href="/dashboard/events/new"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nouvel événement
            </Link>
          )}
        </div>

        {upcoming.length > 0 && (
          <section>
            <h3 className="font-semibold text-slate-700 mb-3">À venir</h3>
            <div className="grid gap-3">
              {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h3 className="font-semibold text-slate-400 mb-3">Passés</h3>
            <div className="grid gap-3 opacity-70">
              {past.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucun événement pour le moment.</p>
            {canCreate && (
              <Link href="/dashboard/events/new" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                Créer le premier événement
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ event }: { event: EventWithMeta }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-slate-700">
          {start.toLocaleDateString("fr", { day: "2-digit", timeZone: "Europe/Paris" })}
        </span>
        <span className="text-xs text-slate-400">
          {start.toLocaleDateString("fr", { month: "short", timeZone: "Europe/Paris" })}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-800 truncate">{event.title}</h4>
          {event.isPublic && (
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full flex-shrink-0">Public</span>
          )}
        </div>

        <p className="text-sm text-slate-500 mt-0.5">
          {start.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })} →{" "}
          {end.toLocaleDateString("fr", { timeZone: "Europe/Paris" }) !== start.toLocaleDateString("fr", { timeZone: "Europe/Paris" })
            ? `${end.toLocaleDateString("fr", { timeZone: "Europe/Paris" })} `
            : ""}
          {end.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
          {event.location && ` · ${event.location}`}
        </p>

        {event.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-1">{event.description}</p>
        )}

        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-slate-400">
            Par {event.creator.name ?? event.creator.organization ?? "—"}
          </span>
          <span className="text-xs text-slate-400">{event._count.tasks} tâche(s)</span>
          <span className="text-xs text-slate-400">{event._count.resources} ressource(s)</span>
        </div>
      </div>
    </Link>
  );
}
