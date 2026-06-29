import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { Navbar } from "@/components/layout/Navbar";
import { MaireAgenda } from "@/components/calendar/MaireAgenda";

export default async function AgendaMairePage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!can(role, "agenda:maire:view")) redirect("/dashboard");

  // Trouver la maire (premier compte avec role MAIRE)
  const maire = await prisma.user.findFirst({
    where: { role: "MAIRE" },
    select: { id: true, name: true, email: true },
  });

  if (!maire) {
    return (
      <div className="flex flex-col flex-1">
        <Navbar title="Agenda de la Maire" />
        <main className="flex-1 p-6">
          <p className="text-slate-400">Aucun compte Maire trouvé.</p>
        </main>
      </div>
    );
  }

  const [slots, maireEvents, allEvents] = await Promise.all([
    prisma.agendaSlot.findMany({
      where: { ownerId: maire.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    // Événements sur lesquels la maire est impliquée
    prisma.event.findMany({
      where: {
        OR: [
          { creatorId: maire.id },
          { isPublic: true },
          { shares: { some: { userId: maire.id } } },
        ],
      },
      include: { creator: { select: { id: true, name: true, organization: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.event.findMany({
      select: { id: true, title: true, startDate: true, endDate: true, location: true, isPublic: true, creator: { select: { id: true, name: true, organization: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const canWrite = can(role, "agenda:maire:write");

  return (
    <div className="flex flex-col flex-1">
      <Navbar title={`Agenda de ${maire.name ?? "la Maire"}`} />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
            {(maire.name ?? maire.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{maire.name}</p>
            <p className="text-xs text-slate-400">{maire.email} · Maire</p>
          </div>
        </div>

        <MaireAgenda
          maireId={maire.id}
          maireName={maire.name ?? "la Maire"}
          slots={slots}
          events={maireEvents}
          allEvents={allEvents}
          canWrite={canWrite}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  );
}
