"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarView } from "./CalendarView";
import { SlotForm } from "./SlotForm";
import type { CalendarEvent, CalendarSlot } from "./CalendarView";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

interface Slot {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  createdBy: { id: string; name?: string | null; role: Role };
  event?: { id: string; title: string } | null;
}

interface Event {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string | null;
  isPublic: boolean;
  creator: { id: string; name?: string | null; organization?: string | null };
}

interface MaireAgendaProps {
  maireId: string;
  maireName: string;
  slots: Slot[];
  events: Event[];
  allEvents: Event[];
  canWrite: boolean;
  currentUserId: string;
}

export function MaireAgenda({ maireId, maireName, slots, events, allEvents, canWrite, currentUserId }: MaireAgendaProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"calendar" | "list">("calendar");

  async function removeSlot(slotId: string) {
    if (!confirm("Supprimer ce créneau de l'agenda de la Maire ?")) return;
    await fetch(`/api/agenda/slots/${slotId}`, { method: "DELETE" });
    router.refresh();
  }

  const now = new Date();

  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location,
    isPublic: e.isPublic,
    creator: e.creator,
  }));

  const calendarSlots: CalendarSlot[] = slots.map((s) => ({
    id: s.id,
    title: s.title,
    startAt: s.startAt,
    endAt: s.endAt,
    location: s.location,
    event: s.event,
    createdBy: s.createdBy,
  }));

  const upcoming = slots.filter((s) => new Date(s.endAt) >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const past = slots.filter((s) => new Date(s.endAt) < now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  return (
    <div className="space-y-5">
      {/* Onglets */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(["calendar", "list"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "calendar" ? "Calendrier" : "Liste des créneaux"}
            </button>
          ))}
        </div>

        {canWrite && (
          <SlotForm
            ownerId={maireId}
            ownerName={maireName}
            availableEvents={allEvents}
          />
        )}
      </div>

      {/* Vue calendrier */}
      {tab === "calendar" && (
        <CalendarView events={calendarEvents} slots={calendarSlots} />
      )}

      {/* Vue liste */}
      {tab === "list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-800 mb-4">
              Créneaux à venir ({upcoming.length})
            </h4>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun créneau planifié.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <SlotRow
                    key={s.id}
                    slot={s}
                    canDelete={canWrite}
                    onDelete={() => removeSlot(s.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 opacity-60">
              <h4 className="font-semibold text-slate-400 mb-4">Passés ({past.length})</h4>
              <div className="space-y-3">
                {past.map((s) => (
                  <SlotRow key={s.id} slot={s} canDelete={false} onDelete={() => {}} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlotRow({ slot, canDelete, onDelete }: { slot: Slot; canDelete: boolean; onDelete: () => void }) {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const sameDay = start.toDateString() === end.toDateString();

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
      {/* Date bloc */}
      <div className="w-14 text-center shrink-0">
        <p className="text-2xl font-bold text-slate-800 leading-none">
          {start.toLocaleDateString("fr", { day: "2-digit" })}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {start.toLocaleDateString("fr", { month: "short" })}
        </p>
        <p className="text-xs text-slate-400">{start.getFullYear()}</p>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800">{slot.title}</p>
        <p className="text-sm text-slate-500 mt-0.5">
          {start.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
          {" → "}
          {!sameDay && `${end.toLocaleDateString("fr", { day: "2-digit", month: "short" })} `}
          {end.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
          {slot.location && ` · ${slot.location}`}
        </p>
        {slot.description && (
          <p className="text-sm text-slate-500 mt-1">{slot.description}</p>
        )}
        {slot.event && (
          <Link href={`/dashboard/events/${slot.event.id}`} className="text-xs text-blue-600 hover:underline mt-1 block">
            🎪 {slot.event.title}
          </Link>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[slot.createdBy.role]}`}>
            {ROLE_LABELS[slot.createdBy.role]}
          </span>
          <span className="text-xs text-slate-400">
            Ajouté par {slot.createdBy.name ?? "—"}
          </span>
        </div>
      </div>

      {canDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}
