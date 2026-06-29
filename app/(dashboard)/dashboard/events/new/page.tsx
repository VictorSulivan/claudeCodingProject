import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { EventForm } from "@/components/forms/EventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!can(role, "events:create:private")) redirect("/dashboard/events");

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Nouvel événement" />
      <main className="flex-1 p-6">
        <div className="max-w-2xl">
          <EventForm canPublish={can(role, "events:create:public")} />
        </div>
      </main>
    </div>
  );
}
