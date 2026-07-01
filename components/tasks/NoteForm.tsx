"use client";

import { useState } from "react";
import type { NoteItem } from "./NoteTimeline";

interface Props {
  taskId: string;
  onNoteCreated: (note: NoteItem) => void;
  onScrollToBottom: () => void;
}

export function NoteForm({ taskId, onNoteCreated, onScrollToBottom }: Props) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!note.trim()) return;
    setError("");
    setSending(true);
    const res = await fetch(`/api/tasks/${taskId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note.trim() }),
    });
    if (res.ok) {
      const newNote: NoteItem = await res.json();
      setNote("");
      onNoteCreated(newNote);
      requestAnimationFrame(onScrollToBottom);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Impossible d'envoyer la note");
    }
    setSending(false);
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
      <p className="text-xs font-semibold text-slate-500 mb-2">{"Ajouter une note d'avancement"}</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
        placeholder="Décrivez ce qui a été fait, un blocage, une action à venir…"
        rows={3}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-slate-50 placeholder-slate-400"
      />
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-400">Ctrl + Entrée pour envoyer</span>
        <button
          onClick={submit}
          disabled={!note.trim() || sending}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {sending ? "Envoi…" : "Publier"}
        </button>
      </div>
    </div>
  );
}
