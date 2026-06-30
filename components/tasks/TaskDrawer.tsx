"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskStatus } from "@/app/generated/prisma/client";
import { NoteTimeline } from "./NoteTimeline";
import type { NoteItem } from "./NoteTimeline";
import { NoteForm } from "./NoteForm";
import { TaskMetadata } from "./TaskMetadata";

type Note = NoteItem;
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

interface TaskDrawerProps {
  taskId: string | null;
  currentUserId: string;
  onClose: () => void;
}

export function TaskDrawer({ taskId, currentUserId: _currentUserId, onClose }: TaskDrawerProps) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const open = taskId !== null;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      <div className={`fixed top-0 right-0 h-full w-125 max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 truncate pr-4 text-base">
            {loading ? "Chargement…" : task?.title ?? "Détail de la tâche"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none shrink-0">✕</button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Chargement…</div>
        )}

        {!loading && loadError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 px-6 text-center">
            <span className="text-2xl">⚠</span>
            <p className="text-sm">Impossible de charger cette tâche.</p>
            <button onClick={() => { setLoadError(false); setLoading(true); }} className="text-xs text-blue-600 underline">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !loadError && task && (
          <>
            <div className="flex-1 overflow-y-auto">
              <TaskMetadata task={task} onClose={onClose} />

              <div className="px-6 pt-5 pb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Journal de progression
                  <span className="ml-1.5 text-slate-300 font-normal normal-case tracking-normal">
                    ({task.notes.length} entrée{task.notes.length !== 1 ? "s" : ""})
                  </span>
                </p>
                <NoteTimeline notes={task.notes} />
                <div ref={notesEndRef} />
              </div>
            </div>

            <NoteForm
              taskId={task.id}
              onNoteCreated={(newNote) => {
                setTask((t) => t ? { ...t, notes: [...t.notes, newNote] } : t);
                router.refresh();
              }}
              onScrollToBottom={() => notesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            />
          </>
        )}
      </div>
    </>
  );
}
