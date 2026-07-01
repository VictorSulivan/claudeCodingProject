"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name?: string | null;
  email?: string;
  organization?: string | null;
}

interface Props {
  eventId: string;
  creator: User;
  shares: { user: User }[];
  allUsers: User[];
  canManage: boolean;
}

export function EventSharePanel({ eventId, creator, shares, allUsers, canManage }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [addUserId, setAddUserId] = useState("");

  const sharedIds = new Set([creator.id, ...shares.map((s) => s.user.id)]);
  const available = allUsers.filter((u) => !sharedIds.has(u.id));

  async function addShare() {
    if (!addUserId) return;
    setError("");
    setLoading("add");
    const res = await fetch(`/api/events/${eventId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addUserId }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'ajout");
      return;
    }
    setAddUserId("");
    router.refresh();
  }

  async function removeShare(userId: string) {
    setError("");
    setLoading(userId);
    const res = await fetch(`/api/events/${eventId}/shares`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors du retrait");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <h4 className="font-semibold text-slate-700 mb-3">
        Participants ({shares.length + 1})
      </h4>

      <div className="space-y-1">
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {(creator.name ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700">{creator.name ?? creator.email}</p>
            <p className="text-xs text-slate-400">Créateur{creator.organization ? ` · ${creator.organization}` : ""}</p>
          </div>
        </div>

        {shares.map((s) => (
          <div key={s.user.id} className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {(s.user.name ?? s.user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">{s.user.name ?? s.user.email}</p>
              {s.user.organization && <p className="text-xs text-slate-400">{s.user.organization}</p>}
            </div>
            {canManage && (
              <button
                onClick={() => removeShare(s.user.id)}
                disabled={loading === s.user.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {loading === s.user.id ? "..." : "Retirer"}
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && available.length > 0 && (
        <div className="mt-4 flex gap-2">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Inviter un membre...</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
          <button
            onClick={addShare}
            disabled={!addUserId || loading === "add"}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading === "add" ? "..." : "Inviter"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
