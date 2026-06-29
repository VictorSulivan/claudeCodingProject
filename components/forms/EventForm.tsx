"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventFormProps {
  canPublish: boolean;
  initial?: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    isPublic?: boolean;
  };
  eventId?: string;
  onSaved?: () => void;
}

export function EventForm({ canPublish, initial, eventId, onSaved }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    location: initial?.location ?? "",
    isPublic: initial?.isPublic ?? false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = eventId ? `/api/events/${eventId}` : "/api/events";
    const method = eventId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
    } else {
      if (onSaved) {
        onSaved();
      } else {
        router.push(`/dashboard/events/${data.id}`);
      }
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nom de l'événement"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Décrivez l'événement..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Début *</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fin *</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Lieu</label>
        <input
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Salle des fêtes, Place du marché..."
        />
      </div>

      {canPublish && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => set("isPublic", e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-slate-700">
            Publier sur le calendrier global
            <span className="text-slate-400 ml-1">(visible par tous)</span>
          </span>
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Enregistrement..." : eventId ? "Mettre à jour" : "Créer l'événement"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
