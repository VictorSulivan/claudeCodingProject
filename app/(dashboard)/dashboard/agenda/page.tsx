import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { AgendaView } from "@/components/calendar/AgendaView";

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [entries, slots, allEvents] = await Promise.all([
    prisma.agendaEntry.findMany({
      where: { userId: session.user.id },
      include: {
        event: { include: { creator: { select: { id: true, name: true, organization: true } } } },
      },
      orderBy: { event: { startDate: "asc" } },
    }),
    prisma.agendaSlot.findMany({
      where: { ownerId: session.user.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { isPublic: true },
          { creatorId: session.user.id },
          { shares: { some: { userId: session.user.id } } },
        ],
      },
      include: { creator: { select: { id: true, name: true, organization: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Mon agenda" />
      <main className="flex-1 p-6">
        <AgendaView
          entries={entries}
          slots={slots}
          allEvents={allEvents}
          userId={session.user.id}
        />
      </main>
    </div>
  );
}
