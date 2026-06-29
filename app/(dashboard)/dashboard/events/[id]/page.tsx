import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { EventDetail } from "@/components/calendar/EventDetail";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, organization: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      resources: {
        include: {
          entries: {
            include: { procuredBy: { select: { id: true, name: true } } },
            orderBy: { procuredAt: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      agendaEntries: { where: { userId: session.user.id } },
    },
  });

  if (!event) notFound();

  const hasAccess =
    event.isPublic ||
    event.creatorId === session.user.id ||
    event.shares.some((s) => s.userId === session.user.id);

  if (!hasAccess) notFound();

  const role = session.user.role as Role;
  const isOwner = event.creatorId === session.user.id;
  const inAgenda = event.agendaEntries.length > 0;

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, organization: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col flex-1">
      <Navbar title={event.title} />
      <main className="flex-1 p-6">
        <EventDetail
          event={{ ...event, inAgenda, agendaNote: event.agendaEntries[0]?.note ?? null }}
          userId={session.user.id}
          role={role}
          isOwner={isOwner}
          canPublish={can(role, "events:create:public")}
          canManageTasks={can(role, "tasks:assign")}
          canManageResources={can(role, "resources:manage")}
          allUsers={allUsers}
        />
      </main>
    </div>
  );
}
