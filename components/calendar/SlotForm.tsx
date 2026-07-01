"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventRef { id: string; title: string }

interface SlotFormProps {
  ownerId: string;           // à qui appartient cet agenda
  ownerName?: string;        // affiché si différent de l'utilisateur courant
  availableEvents?: EventRef[];
  onSuccess?: () => void;
}

function dateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SlotForm({ ownerId, ownerName, availableEvents = [], onSuccess }: SlotFormProps) {
  const router = useRouter();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startAt: dateTimeLocal(now),
    endAt: dateTimeLocal(inOneHour),
    eventId: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.title.trim() || !form.startAt || !form.endAt) return;
    if (form.endAt <= form.startAt) {
      setError("La fin doit être après le début");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/agenda/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        startAt: form.startAt,
        endAt: form.endAt,
        eventId: form.eventId || undefined,
        ownerId,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setForm({ title: "", description: "", location: "", startAt: dateTimeLocal(new Date()), endAt: dateTimeLocal(inOneHour), eventId: "" });
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue");
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouveau créneau{ownerName ? ` pour ${ownerName}` : ""}
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="font-semibold text-slate-700 text-sm">
            Nouveau créneau{ownerName ? <span className="text-blue-600"> — {ownerName}</span> : ""}
          </h4>

          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Titre *"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Début *</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => set("startAt", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fin *</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => set("endAt", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Lieu (optionnel)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Description / notes (optionnel)"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {availableEvents.length > 0 && (
            <select
              value={form.eventId}
              onChange={(e) => set("eventId", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Lier à un événement (optionnel)</option>
              {availableEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={!form.title.trim() || !form.startAt || !form.endAt || loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Enregistrement…" : "Ajouter"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
