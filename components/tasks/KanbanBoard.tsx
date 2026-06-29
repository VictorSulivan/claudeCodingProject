"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TaskStatus } from "@/app/generated/prisma/client";
import Link from "next/link";
import { TaskDrawer } from "./TaskDrawer";

interface User { id: string; name?: string | null; email?: string }
interface EventRef { id: string; title: string }
interface Task {
  id: string; title: string; description?: string | null; status: TaskStatus;
  assignee?: User | null; event?: EventRef | null; dueDate?: Date | string | null;
}

interface KanbanBoardProps {
  tasks: Task[];
  canAssign: boolean;
  currentUserId: string;
  allUsers: User[];
  allEvents: EventRef[];
}

const COLUMNS: { key: TaskStatus; label: string; color: string; bg: string }[] = [
  { key: "TODO", label: "À faire", color: "text-slate-600", bg: "bg-slate-50" },
  { key: "IN_PROGRESS", label: "En cours", color: "text-amber-700", bg: "bg-amber-50" },
  { key: "DONE", label: "Terminé", color: "text-green-700", bg: "bg-green-50" },
];

type SortBy = "createdAt" | "dueDate_asc" | "dueDate_desc";

export function KanbanBoard({ tasks, canAssign, currentUserId, allUsers, allEvents }: KanbanBoardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigneeId: "", eventId: "", dueDate: "" });
  const [loading, setLoading] = useState(false);
  const [filterEventId, setFilterEventId] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const displayedTasks = useMemo(() => {
    let result = filterEventId
      ? tasks.filter((t) => t.event?.id === filterEventId)
      : tasks;

    if (sortBy === "dueDate_asc") {
      result = [...result].sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return da - db;
      });
    } else if (sortBy === "dueDate_desc") {
      result = [...result].sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
        return db - da;
      });
    }

    return result;
  }, [tasks, filterEventId, sortBy]);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function createTask() {
    if (!form.title) return;
    setLoading(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        assigneeId: form.assigneeId || undefined,
        eventId: form.eventId || undefined,
        dueDate: form.dueDate || undefined,
      }),
    });
    setForm({ title: "", description: "", assigneeId: "", eventId: "", dueDate: "" });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Supprimer cette tâche ?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
    <TaskDrawer
      taskId={openTaskId}
      currentUserId={currentUserId}
      onClose={() => setOpenTaskId(null)}
    />
    <div className="space-y-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filtre événement */}
        <select
          value={filterEventId}
          onChange={(e) => setFilterEventId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tous les événements</option>
          {allEvents.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>

        {/* Tri par date */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="createdAt">Tri : par défaut</option>
          <option value="dueDate_asc">Échéance croissante</option>
          <option value="dueDate_desc">Échéance décroissante</option>
        </select>

        <p className="text-sm text-slate-400 ml-auto">
          {displayedTasks.length} / {tasks.length} tâche{tasks.length > 1 ? "s" : ""}
        </p>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvelle tâche
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
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
          <div className="flex gap-2">
            <button
              onClick={createTask}
              disabled={!form.title || loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Création..." : "Créer"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Colonnes Kanban */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = displayedTasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`rounded-xl border border-slate-200 ${col.bg} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold text-sm ${col.color}`}>{col.label}</h4>
                <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    canAssign={canAssign}
                    onOpen={() => setOpenTaskId(task.id)}
                    onMove={(status) => moveTask(task.id, status)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-center text-slate-400 py-4">Aucune tâche</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}

function TaskCard({
  task, currentUserId, canAssign, onOpen, onMove, onDelete,
}: {
  task: Task;
  currentUserId: string;
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

      {/* Boutons de déplacement — accessibles à tous */}
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
