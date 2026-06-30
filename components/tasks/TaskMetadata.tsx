"use client";

import Link from "next/link";
import { TaskStatus } from "@/app/generated/prisma/client";

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

interface TaskMeta {
  status: TaskStatus;
  description?: string | null;
  dueDate?: string | null;
  createdAt: string;
  assignee?: { name?: string | null; organization?: string | null } | null;
  event?: { id: string; title: string } | null;
}

export function TaskMetadata({ task, onClose }: { task: TaskMeta; onClose: () => void }) {
  return (
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
                ? "text-red-600" : "text-slate-700"
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
  );
}
