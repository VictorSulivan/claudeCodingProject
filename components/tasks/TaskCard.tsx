"use client";

import Link from "next/link";
import { TaskStatus } from "@/app/generated/prisma/client";

interface User { id: string; name?: string | null; email?: string }
interface EventRef { id: string; title: string }
export interface TaskCardData {
  id: string; title: string; description?: string | null; status: TaskStatus;
  assignee?: User | null; event?: EventRef | null; dueDate?: Date | string | null;
}

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "À faire" },
  { key: "IN_PROGRESS", label: "En cours" },
  { key: "DONE", label: "Terminé" },
];

export function TaskCard({
  task, canAssign, onOpen, onMove, onDelete,
}: {
  task: TaskCardData;
  canAssign: boolean;
  onOpen: () => void;
  onMove: (s: TaskStatus) => void;
  onDelete: () => void;
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const nextStatuses = COLUMNS.filter((c) => c.key !== task.status);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm group">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onOpen}
          className="text-sm font-medium text-slate-800 flex-1 text-left hover:text-blue-600 transition-colors"
        >
          {task.title}
        </button>
        {canAssign && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2 space-y-1">
        {task.event && (
          <Link
            href={`/dashboard/events/${task.event.id}`}
            className="text-xs text-blue-600 hover:underline block truncate"
          >
            🎪 {task.event.title}
          </Link>
        )}
        {task.assignee && (
          <p className="text-xs text-slate-400">→ {task.assignee.name}</p>
        )}
        {task.dueDate && (
          <p className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
            {isOverdue ? "⚠ " : ""}Échéance : {new Date(task.dueDate).toLocaleDateString("fr")}
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-1">
        {nextStatuses.map((s) => (
          <button
            key={s.key}
            onClick={() => onMove(s.key)}
            className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            → {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
