import Link from "next/link";
import { TaskStatus } from "@/app/generated/prisma/client";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | null;
};

type Props = {
  tasks: Task[];
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};

export function MyTasksList({ tasks }: Props) {
  const now = new Date();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800">Mes tâches</h4>
        <Link href="/dashboard/tasks" className="text-sm text-blue-600 hover:underline transition-colors">
          Voir tout
        </Link>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 && (
          <p className="text-slate-400 text-sm">Aucune tâche en cours.</p>
        )}
        {tasks.map((t) => {
          const isOverdue =
            t.dueDate !== null &&
            t.dueDate < now &&
            t.status !== "DONE" &&
            t.status !== "CANCELLED";
          return (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[t.status]}`}>
                {STATUS_LABELS[t.status]}
              </span>
              <p className="text-sm text-slate-700 truncate flex-1">{t.title}</p>
              {t.dueDate && (
                <p className={`text-xs flex-shrink-0 ${isOverdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                  {isOverdue && "! "}
                  {t.dueDate.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
