import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [events, slots] = await Promise.all([
    prisma.event.findMany({
      where: { isPublic: true },
      include: { creator: { select: { id: true, name: true, organization: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.agendaSlot.findMany({
      where: { ownerId: session.user.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Calendrier global" />
      <main className="flex-1 p-6">
        <p className="text-slate-500 text-sm mb-4">
          Événements publics de la mairie · Vos créneaux personnels en violet
        </p>
        <CalendarView events={events} slots={slots} />
      </main>
    </div>
  );
}
