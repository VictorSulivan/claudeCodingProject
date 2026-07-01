"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TaskStatus } from "@/app/generated/prisma/client";
import { TaskDrawer } from "./TaskDrawer";
import { TaskCard } from "./TaskCard";
import type { TaskCardData } from "./TaskCard";
import { NewTaskForm } from "./NewTaskForm";

interface User { id: string; name?: string | null; email?: string }
interface EventRef { id: string; title: string }
type Task = TaskCardData;

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
  const [filterEventId, setFilterEventId] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

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
    setDeleteError("");
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Impossible de supprimer la tâche");
      return;
    }
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

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{deleteError}</p>
      )}

      {showForm && (
        <NewTaskForm
          canAssign={canAssign}
          allUsers={allUsers}
          allEvents={allEvents}
          onCreated={() => { setShowForm(false); router.refresh(); }}
          onCancel={() => setShowForm(false)}
        />
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

