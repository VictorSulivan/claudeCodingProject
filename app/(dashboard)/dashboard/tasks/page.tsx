import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { Navbar } from "@/components/layout/Navbar";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  const canAssign = can(role, "tasks:assign");

  const tasks = await prisma.task.findMany({
    include: {
      assignee: { select: { id: true, name: true } },
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const [allUsers, allEvents] = await Promise.all([
    canAssign
      ? prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : [],
    prisma.event.findMany({ select: { id: true, title: true }, orderBy: { startDate: "asc" } }),
  ]);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Tâches" />
      <main className="flex-1 p-6">
        <KanbanBoard
          tasks={tasks}
          canAssign={canAssign}
          currentUserId={session.user.id}
          allUsers={allUsers}
          allEvents={allEvents}
        />
      </main>
    </div>
  );
}
