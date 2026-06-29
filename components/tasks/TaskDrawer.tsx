"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TaskStatus, Role } from "@/app/generated/prisma/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";

interface Author { id: string; name?: string | null; role: Role }
interface Note { id: string; content: string; createdAt: string; author: Author }
interface TaskDetail {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  assignee?: { id: string; name?: string | null; organization?: string | null } | null;
  event?: { id: string; title: string } | null;
  notes: Note[];
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

interface TaskDrawerProps {
  taskId: string | null;
  currentUserId: string;
  onClose: () => void;
}

export function TaskDrawer({ taskId, currentUserId, onClose }: TaskDrawerProps) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!taskId) { setTask(null); setLoadError(false); return; }
    setLoading(true);
    setLoadError(false);
    fetch(`/api/tasks/${taskId}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: TaskDetail) => { setTask(data); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, [taskId]);

  async function submitNote() {
    if (!note.trim() || !taskId) return;
    setSending(true);
    const res = await fetch(`/api/tasks/${taskId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note.trim() }),
    });
    if (res.ok) {
      const newNote: Note = await res.json();
      setTask((t) => t ? { ...t, notes: [...t.notes, newNote] } : t);
      setNote("");
      setTimeout(() => notesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      router.refresh();
    }
    setSending(false);
  }

  const open = taskId !== null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      {/*
        Structure : panel (flex-col h-full)
          ├── header          → hauteur fixe
          ├── zone scrollable → flex-1 overflow-y-auto  (métadonnées + notes)
          └── formulaire      → shrink-0           (toujours visible en bas)
      */}
      <div
        className={`fixed top-0 right-0 h-full w-125 max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── En-tête ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 truncate pr-4 text-base">
            {loading ? "Chargement…" : task?.title ?? "Détail de la tâche"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Chargement ── */}
        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Chargement…
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && loadError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 px-6 text-center">
            <span className="text-2xl">⚠</span>
            <p className="text-sm">Impossible de charger cette tâche.</p>
            <button
              onClick={() => { setLoadError(false); setLoading(true); }}
              className="text-xs text-blue-600 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Contenu ── */}
        {!loading && !loadError && task && (
          <>
            {/* Zone scrollable : métadonnées + notes */}
            <div className="flex-1 overflow-y-auto">

              {/* Métadonnées */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.event && (
                    <Link
                      href={`/dashboard/events/${task.event.id}`}
                      className="text-xs text-blue-600 hover:underline"
                      onClick={onClose}
                    >
                      🎪 {task.event.title}
                    </Link>
                  )}
                </div>

                {task.description && (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {task.assignee && (
                    <div>
                      <p className="text-slate-400 mb-0.5">Assigné à</p>
                      <p className="text-slate-700 font-medium">{task.assignee.name}</p>
                      {task.assignee.organization && (
                        <p className="text-slate-400">{task.assignee.organization}</p>
                      )}
                    </div>
                  )}
                  {task.dueDate && (
                    <div>
                      <p className="text-slate-400 mb-0.5">Échéance</p>
                      <p className={`font-medium ${
                        new Date(task.dueDate) < new Date() && task.status !== "DONE"
                          ? "text-red-600"
                          : "text-slate-700"
                      }`}>
                        {new Date(task.dueDate).toLocaleDateString("fr", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 mb-0.5">Créée le</p>
                    <p className="text-slate-700">
                      {new Date(task.createdAt).toLocaleDateString("fr", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Journal de progression */}
              <div className="px-6 pt-5 pb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Journal de progression
                  <span className="ml-1.5 text-slate-300 font-normal normal-case tracking-normal">
                    ({task.notes.length} entrée{task.notes.length !== 1 ? "s" : ""})
                  </span>
                </p>

                {task.notes.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <p className="text-sm">Aucune note pour l'instant.</p>
                    <p className="text-xs mt-1">Utilisez le formulaire ci-dessous pour décrire l'avancement.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {task.notes.map((n, i) => (
                      <div key={n.id} className="flex gap-3">
                        {/* Ligne de timeline */}
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-slate-500">
                              {(n.author.name ?? "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {i < task.notes.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 mt-1" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-medium text-slate-800">{n.author.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[n.author.role]}`}>
                              {ROLE_LABELS[n.author.role]}
                            </span>
                            <span className="text-xs text-slate-400 ml-auto">
                              {new Date(n.createdAt).toLocaleString("fr", {
                                day: "numeric", month: "short",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {n.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div ref={notesEndRef} />
              </div>
            </div>

            {/* ── Formulaire nouvelle note — toujours visible en bas ── */}
            <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Ajouter une note d'avancement</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitNote();
                }}
                placeholder="Décrivez ce qui a été fait, un blocage, une action à venir…"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-slate-50 placeholder-slate-400"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">Ctrl + Entrée pour envoyer</span>
                <button
                  onClick={submitNote}
                  disabled={!note.trim() || sending}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {sending ? "Envoi…" : "Publier"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
