"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role, TaskStatus } from "@/app/generated/prisma/client";
import { can } from "@/lib/permissions";
import { ResourcePanel } from "@/components/resources/ResourcePanel";
import { EventSharePanel } from "@/components/calendar/EventSharePanel";

interface User { id: string; name?: string | null; email?: string; organization?: string | null }
interface TaskItem {
  id: string; title: string; description?: string | null; status: TaskStatus;
  assignee?: User | null; dueDate?: Date | string | null;
}
interface ResourceEntry {
  id: string; quantity: number; location?: string | null; notes?: string | null;
  procuredAt: Date | string; procuredBy: User;
}
interface ResourceItem {
  id: string; name: string; description?: string | null;
  quantityNeeded: number; unit?: string | null;
  entries: ResourceEntry[];
}
interface EventData {
  id: string; title: string; description?: string | null;
  startDate: Date | string; endDate: Date | string; location?: string | null;
  isPublic: boolean; inAgenda: boolean; agendaNote?: string | null;
  creator: User;
  shares: { user: User }[];
  tasks: TaskItem[];
  resources: ResourceItem[];
}

interface Props {
  event: EventData;
  userId: string;
  role: Role;
  isOwner: boolean;
  canPublish: boolean;
  canManageTasks: boolean;
  canManageResources: boolean;
  allUsers: User[];
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

export function EventDetail({ event, userId: _userId, role, isOwner, canPublish: _canPublish, canManageTasks, canManageResources, allUsers }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "tasks" | "resources">("info");
  const [inAgenda, setInAgenda] = useState(event.inAgenda);
  const [agendaLoading, setAgendaLoading] = useState(false);

  // Task form state
  const [newTask, setNewTask] = useState({ title: "", description: "", assigneeId: "", dueDate: "" });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState("");

  async function toggleAgenda() {
    setAgendaLoading(true);
    if (inAgenda) {
      await fetch(`/api/agenda/${event.id}`, { method: "DELETE" });
      setInAgenda(false);
    } else {
      await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      setInAgenda(true);
    }
    setAgendaLoading(false);
    router.refresh();
  }

  async function deleteEvent() {
    if (!confirm("Supprimer cet événement ? Cette action est irréversible.")) return;
    await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    router.push("/dashboard/events");
    router.refresh();
  }

  async function addTask() {
    if (!newTask.title.trim()) return;
    setTaskError("");
    setTaskLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title.trim(),
        description: newTask.description,
        eventId: event.id,
        assigneeId: newTask.assigneeId || undefined,
        dueDate: newTask.dueDate || undefined,
      }),
    });
    setTaskLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTaskError(data.error ?? "Une erreur est survenue");
      return;
    }
    setNewTask({ title: "", description: "", assigneeId: "", dueDate: "" });
    router.refresh();
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-800">{event.title}</h2>
              {event.isPublic && (
                <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Public</span>
              )}
            </div>
            <p className="text-slate-500 text-sm">
              {start.toLocaleDateString("fr", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}
              {start.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
              {" → "}
              {end.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
              {start.toDateString() !== end.toDateString() && ` (${end.toLocaleDateString("fr")})`}
            </p>
            {event.location && (
              <p className="text-slate-500 text-sm mt-0.5">📍 {event.location}</p>
            )}
            <p className="text-slate-400 text-xs mt-1">
              Créé par {event.creator.name ?? "—"}
              {event.creator.organization && ` (${event.creator.organization})`}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={toggleAgenda}
              disabled={agendaLoading}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                inAgenda
                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {inAgenda ? "✓ Dans mon agenda" : "+ Ajouter à mon agenda"}
            </button>
            {(isOwner || can(role, "events:delete:any")) && (
              <button
                onClick={deleteEvent}
                className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>

        {event.description && (
          <p className="mt-4 text-slate-600 text-sm whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1">
        {(["info", "tasks", "resources"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "info" ? "Informations" : t === "tasks" ? `Tâches (${event.tasks.length})` : `Ressources (${event.resources.length})`}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <EventSharePanel
            eventId={event.id}
            creator={event.creator}
            shares={event.shares}
            allUsers={allUsers}
            canManage={isOwner || can(role, "events:delete:any")}
          />
        </div>
      )}

      {/* Tasks tab */}
      {tab === "tasks" && (
        <div className="space-y-4">
          {canManageTasks && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-700 mb-4">Ajouter une tâche</h4>
              <div className="space-y-3">
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Titre de la tâche *"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optionnel)"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask((f) => ({ ...f, assigneeId: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Assigner à... (optionnel)</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask((f) => ({ ...f, dueDate: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {taskError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{taskError}</p>
                )}
                <button
                  onClick={addTask}
                  disabled={!newTask.title.trim() || taskLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Ajouter la tâche
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-700 mb-4">Tâches ({event.tasks.length})</h4>
            {event.tasks.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune tâche pour cet événement.</p>
            ) : (
              <div className="space-y-3">
                {event.tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[task.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {task.assignee && (
                          <span className="text-xs text-slate-400">→ {task.assignee.name}</span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-slate-400">
                            Échéance : {new Date(task.dueDate).toLocaleDateString("fr")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources tab */}
      {tab === "resources" && (
        <ResourcePanel
          resources={event.resources}
          eventId={event.id}
          canManage={canManageResources}
        />
      )}
    </div>
  );
}
