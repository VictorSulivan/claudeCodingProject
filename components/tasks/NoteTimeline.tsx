"use client";

import { Role } from "@/app/generated/prisma/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";

interface Author { id: string; name?: string | null; role: Role }
export interface NoteItem { id: string; content: string; createdAt: string; author: Author }

export function NoteTimeline({ notes }: { notes: NoteItem[] }) {
  if (notes.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400">
        <p className="text-sm">{"Aucune note pour l'instant."}</p>
        <p className="text-xs mt-1">{"Utilisez le formulaire ci-dessous pour décrire l'avancement."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {notes.map((n, i) => (
        <div key={n.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                {(n.author.name ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
            {i < notes.length - 1 && (
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
  );
}
