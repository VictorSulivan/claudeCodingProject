import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { EventsFilter } from "@/components/events/EventsFilter";
import type { EventItem } from "@/components/events/EventCard";
import Link from "next/link";

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

  const serialized: EventItem[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    location: e.location,
    isPublic: e.isPublic,
    creator: e.creator,
    _count: e._count,
  }));

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Événements" />
      <main className="flex-1 p-6 space-y-4">
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
        <EventsFilter events={serialized} canCreate={canCreate} />
      </main>
    </div>
  );
}
