"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarView } from "./CalendarView";
import { SlotForm } from "./SlotForm";
import type { CalendarEvent, CalendarSlot } from "./CalendarView";

interface AgendaEvent {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string | null;
  isPublic: boolean;
  creator: { id: string; name?: string | null; organization?: string | null };
}

interface AgendaEntry {
  id: string;
  note?: string | null;
  event: AgendaEvent;
}

interface AgendaSlot {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  createdBy: { id: string; name?: string | null; role: string };
  event?: { id: string; title: string } | null;
}

interface AgendaViewProps {
  entries: AgendaEntry[];
  slots: AgendaSlot[];
  allEvents: AgendaEvent[];
  userId: string;
}

export function AgendaView({ entries, slots, allEvents, userId }: AgendaViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"calendar" | "list">("calendar");
  const [addingEventId, setAddingEventId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const entryEventIds = new Set(entries.map((e) => e.event.id));
  const availableEvents = allEvents.filter((e) => !entryEventIds.has(e.id));

  async function addToAgenda() {
    if (!addingEventId) return;
    setLoading(true);
    await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: addingEventId, note }),
    });
    setAddingEventId(""); setNote(""); setLoading(false);
    router.refresh();
  }

  async function removeFromAgenda(eventId: string) {
    await fetch(`/api/agenda/${eventId}`, { method: "DELETE" });
    router.refresh();
  }

  async function removeSlot(slotId: string) {
    await fetch(`/api/agenda/slots/${slotId}`, { method: "DELETE" });
    router.refresh();
  }

  const now = new Date();
  const upcomingEntries = entries.filter((e) => new Date(e.event.startDate) >= now);
  const pastEntries = entries.filter((e) => new Date(e.event.startDate) < now);
  const upcomingSlots = slots.filter((s) => new Date(s.endAt) >= now);
  const pastSlots = slots.filter((s) => new Date(s.endAt) < now);

  // Données unifiées pour le CalendarView
  const calendarEvents: CalendarEvent[] = entries.map((e) => ({
    id: e.event.id,
    title: e.event.title,
    startDate: e.event.startDate,
    endDate: e.event.endDate,
    location: e.event.location,
    isPublic: e.event.isPublic,
    creator: e.event.creator,
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

  return (
    <div className="space-y-5">
      {/* Onglets */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(["calendar", "list"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "calendar" ? "Calendrier" : "Liste"}
          </button>
        ))}
      </div>

      {/* Ajouter un créneau */}
      <SlotForm ownerId={userId} availableEvents={availableEvents} />

      {/* Ajouter un event à l'agenda */}
      {availableEvents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Ajouter un événement à mon agenda</p>
          <div className="flex gap-3 flex-wrap">
            <select
              value={addingEventId}
              onChange={(e) => setAddingEventId(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choisir un événement…</option>
              {availableEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} — {new Date(e.startDate).toLocaleDateString("fr")}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note personnelle (optionnel)"
              className="flex-1 min-w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addToAgenda}
              disabled={!addingEventId || loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Vue calendrier */}
      {tab === "calendar" && (
        <CalendarView events={calendarEvents} slots={calendarSlots} />
      )}

      {/* Vue liste */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* À venir */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-800 mb-4">
              À venir ({upcomingEntries.length + upcomingSlots.length})
            </h4>
            {upcomingEntries.length === 0 && upcomingSlots.length === 0 ? (
              <p className="text-slate-400 text-sm">Rien à venir dans votre agenda.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEntries.map((e) => (
                  <AgendaEntryCard key={e.id} entry={e} onRemove={() => removeFromAgenda(e.event.id)} />
                ))}
                {upcomingSlots.map((s) => (
                  <SlotCard key={s.id} slot={s} onRemove={() => removeSlot(s.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Passés */}
          {(pastEntries.length > 0 || pastSlots.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 opacity-60">
              <h4 className="font-semibold text-slate-400 mb-4">Passés</h4>
              <div className="space-y-3">
                {pastEntries.map((e) => (
                  <AgendaEntryCard key={e.id} entry={e} onRemove={() => removeFromAgenda(e.event.id)} />
                ))}
                {pastSlots.map((s) => (
                  <SlotCard key={s.id} slot={s} onRemove={() => removeSlot(s.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgendaEntryCard({ entry, onRemove }: { entry: AgendaEntry; onRemove: () => void }) {
  const start = new Date(entry.event.startDate);
  const end = new Date(entry.event.endDate);
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
        <span className="text-sm font-bold text-blue-600">{start.toLocaleDateString("fr", { day: "2-digit" })}</span>
        <span className="text-xs text-blue-400">{start.toLocaleDateString("fr", { month: "short" })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/dashboard/events/${entry.event.id}`} className="font-medium text-slate-800 hover:text-blue-600 transition-colors">
          {entry.event.title}
        </Link>
        <p className="text-sm text-slate-500 mt-0.5">
          {start.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} → {end.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
          {entry.event.location && ` · ${entry.event.location}`}
        </p>
        {entry.note && <p className="text-sm text-slate-400 mt-1 italic">{entry.note}</p>}
      </div>
      <span className="text-xs text-blue-500 shrink-0">Événement</span>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors text-sm px-1 shrink-0">✕</button>
    </div>
  );
}

function SlotCard({ slot, onRemove }: { slot: AgendaSlot; onRemove: () => void }) {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-purple-100 bg-purple-50/40 hover:border-purple-200 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-purple-50 flex flex-col items-center justify-center shrink-0">
        <span className="text-sm font-bold text-purple-600">{start.toLocaleDateString("fr", { day: "2-digit" })}</span>
        <span className="text-xs text-purple-400">{start.toLocaleDateString("fr", { month: "short" })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800">{slot.title}</p>
        <p className="text-sm text-slate-500 mt-0.5">
          {start.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} → {end.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
          {slot.location && ` · ${slot.location}`}
        </p>
        {slot.description && <p className="text-sm text-slate-400 mt-1">{slot.description}</p>}
        {slot.event && (
          <Link href={`/dashboard/events/${slot.event.id}`} className="text-xs text-blue-600 hover:underline mt-0.5 block">
            🎪 {slot.event.title}
          </Link>
        )}
      </div>
      <span className="text-xs text-purple-500 shrink-0">Créneau</span>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors text-sm px-1 shrink-0">✕</button>
    </div>
  );
}
