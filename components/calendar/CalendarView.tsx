"use client";

import { useState } from "react";
import Link from "next/link";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string | null;
  isPublic: boolean;
  creator: { id: string; name?: string | null; organization?: string | null };
}

export interface CalendarSlot {
  id: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string;
  location?: string | null;
  event?: { id: string; title: string } | null;
  createdBy: { id: string; name?: string | null };
}

interface CalendarViewProps {
  events: CalendarEvent[];
  slots?: CalendarSlot[];
}

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarView({ events, slots = [] }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<{ day: number } | null>(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  function eventsOnDay(day: number) {
    return events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function slotsOnDay(day: number) {
    return slots.filter((s) => {
      const d = new Date(s.startAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function navigate(dir: -1 | 1) {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const selectedEvents = selected ? eventsOnDay(selected.day) : [];
  const selectedSlots = selected ? slotsOnDay(selected.day) : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 font-bold text-lg">‹</button>
          <div className="text-center">
            <h3 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 justify-center">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" /> Événements</span>
              {slots.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-400 inline-block" /> Créneaux</span>}
            </div>
          </div>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 font-bold text-lg">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - startOffset + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= lastDay.getDate();
            const isToday = isCurrentMonth && dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selected?.day === dayNum && isCurrentMonth;
            const dayEvents = isCurrentMonth ? eventsOnDay(dayNum) : [];
            const daySlots = isCurrentMonth ? slotsOnDay(dayNum) : [];
            const hasItems = dayEvents.length > 0 || daySlots.length > 0;

            return (
              <div
                key={i}
                onClick={() => isCurrentMonth && setSelected(isSelected ? null : { day: dayNum })}
                className={`min-h-24 p-2 border-b border-r border-slate-100 transition-colors ${
                  !isCurrentMonth ? "bg-slate-50" : hasItems ? "cursor-pointer hover:bg-slate-50" : ""
                } ${isSelected ? "bg-blue-50" : ""}`}
              >
                {isCurrentMonth && (
                  <>
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday ? "bg-blue-600 text-white" : "text-slate-700"
                    }`}>
                      {dayNum}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="block truncate text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      ))}
                      {daySlots.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="block truncate text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800"
                          title={s.title}
                        >
                          {s.title}
                        </div>
                      ))}
                      {dayEvents.length + daySlots.length > 4 && (
                        <p className="text-xs text-slate-400 px-1">+{dayEvents.length + daySlots.length - 4} autres</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      {selected && (selectedEvents.length > 0 || selectedSlots.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-800 mb-4">
            {selected.day} {MONTHS[month]} {year}
          </h4>
          <div className="space-y-3">
            {selectedEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/events/${e.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
                    {e.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(e.startDate).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} →{" "}
                    {new Date(e.endDate).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                    {e.location && ` · ${e.location}`}
                  </p>
                </div>
                <span className="text-xs text-blue-500 shrink-0">Événement</span>
              </div>
            ))}
            {selectedSlots.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(s.startAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} →{" "}
                    {new Date(s.endAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                    {s.location && ` · ${s.location}`}
                  </p>
                  {s.createdBy?.name && (
                    <p className="text-xs text-slate-400 mt-0.5">Par {s.createdBy.name}</p>
                  )}
                  {s.event && (
                    <Link href={`/dashboard/events/${s.event.id}`} className="text-xs text-blue-600 hover:underline mt-0.5 block">
                      🎪 {s.event.title}
                    </Link>
                  )}
                </div>
                <span className="text-xs text-purple-500 shrink-0">Créneau</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
