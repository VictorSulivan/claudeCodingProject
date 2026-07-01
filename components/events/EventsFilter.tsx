"use client";

import { useMemo, useState } from "react";
import { EventCard, type EventItem } from "./EventCard";

type Props = {
  events: EventItem[];
  canCreate: boolean;
};

export function EventsFilter({ events, canCreate }: Props) {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (query && !e.title.toLowerCase().includes(query.toLowerCase())) return false;
      const start = new Date(e.startDate);
      if (from && start < new Date(from)) return false;
      if (to && start > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [events, query, from, to]);

  const now = new Date().toISOString();
  const upcoming = filtered.filter((e) => e.startDate >= now);
  const past = filtered.filter((e) => e.startDate < now);
  const hasFilter = query || from || to;

  function reset() {
    setQuery("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-slate-200 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par titre..."
          className="flex-1 min-w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 shrink-0">Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="text-xs text-slate-500 shrink-0">au</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {hasFilter && (
          <button
            onClick={reset}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Réinitialiser
          </button>
        )}
        <p className="text-sm text-slate-400 ml-auto shrink-0">
          {filtered.length} / {events.length}
        </p>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-700 mb-3">À venir</h3>
          <div className="grid gap-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-400 mb-3">Passés</h3>
          <div className="grid gap-3 opacity-70">
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {hasFilter ? "Aucun événement ne correspond aux critères." : "Aucun événement pour le moment."}
          </p>
          {hasFilter ? (
            <button onClick={reset} className="mt-2 text-blue-600 hover:underline text-sm transition-colors">
              Effacer les filtres
            </button>
          ) : canCreate && (
            <a href="/dashboard/events/new" className="mt-2 inline-block text-blue-600 hover:underline text-sm">
              Créer le premier événement
            </a>
          )}
        </div>
      )}
    </div>
  );
}
