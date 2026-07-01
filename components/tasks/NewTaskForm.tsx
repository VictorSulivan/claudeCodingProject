"use client";

import { useState } from "react";

interface User { id: string; name?: string | null; email?: string }
interface EventRef { id: string; title: string }

interface Props {
  canAssign: boolean;
  allUsers: User[];
  allEvents: EventRef[];
  onCreated: () => void;
  onCancel: () => void;
}

export function NewTaskForm({ canAssign, allUsers, allEvents, onCreated, onCancel }: Props) {
  const [form, setForm] = useState({ title: "", description: "", assigneeId: "", eventId: "", dueDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit() {
    if (!form.title.trim()) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description || undefined,
        assigneeId: form.assigneeId || undefined,
        eventId: form.eventId || undefined,
        dueDate: form.dueDate || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue");
      return;
    }
    onCreated();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <h4 className="font-semibold text-slate-700">Nouvelle tâche</h4>
      <input
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Titre *"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Description..."
        rows={2}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="grid grid-cols-3 gap-3">
        {canAssign && (
          <select
            value={form.assigneeId}
            onChange={(e) => set("assigneeId", e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Assigner à...</option>
            {allUsers.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
          </select>
        )}
        <select
          value={form.eventId}
          onChange={(e) => set("eventId", e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Lier à un événement...</option>
          {allEvents.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => set("dueDate", e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!form.title.trim() || loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Création..." : "Créer"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
