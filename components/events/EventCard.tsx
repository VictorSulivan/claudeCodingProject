"use client";

import Link from "next/link";

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  isPublic: boolean;
  creator: { id: string; name: string | null; organization: string | null };
  _count: { tasks: number; resources: number; shares: number };
}

export function EventCard({ event }: { event: EventItem }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const startStr = start.toLocaleDateString("fr-FR");
  const endStr = end.toLocaleDateString("fr-FR");

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
        <span className="text-sm font-bold text-slate-700">
          {start.toLocaleDateString("fr-FR", { day: "2-digit" })}
        </span>
        <span className="text-xs text-slate-400">
          {start.toLocaleDateString("fr-FR", { month: "short" })}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-800 truncate">{event.title}</h4>
          {event.isPublic && (
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full shrink-0">Public</span>
          )}
        </div>

        <p className="text-sm text-slate-500 mt-0.5">
          {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} →{" "}
          {endStr !== startStr ? `${endStr} ` : ""}
          {end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
