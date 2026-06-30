"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";

interface UserRow {
  id: string; email: string; name?: string | null; role: Role;
  organization?: string | null; createdAt: Date | string;
  _count: { assignedTasks: number; createdEvents: number };
}

const ROLES: Role[] = ["ADMIN", "MAIRE", "ADJOINTE", "EMPLOYEE", "CONTRACTANT"];

export function UsersAdmin({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", userRole: "EMPLOYEE" as Role, organization: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function createUser() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erreur"); return; }
    setShowForm(false);
    setForm({ email: "", name: "", password: "", userRole: "EMPLOYEE", organization: "" });
    router.refresh();
  }

  async function updateRole(userId: string, userRole: Role) {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userRole }),
    });
    router.refresh();
  }

  async function deleteUser(userId: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    router.refresh();
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.organization ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <span className="text-sm text-slate-500 flex-1">{filtered.length} utilisateur(s)</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h4 className="font-semibold text-slate-700">Créer un compte</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              type="email"
              placeholder="Email *"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nom complet"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              type="password"
              placeholder="Mot de passe *"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
              placeholder="Organisation (texte libre)"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.userRole}
              onChange={(e) => set("userRole", e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={createUser}
              disabled={!form.email || !form.password || loading}
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

      {/* Table des utilisateurs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Utilisateur</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Organisation</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Rôle</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Activité</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Créé le</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                      {(u.name ?? u.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{u.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.organization ?? "—"}</td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value as Role)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {u._count.createdEvents} événement(s) · {u._count.assignedTasks} tâche(s)
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("fr")}
                </td>
                <td className="px-4 py-3">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors text-xs"
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">Aucun utilisateur trouvé.</p>
        )}
      </div>
    </div>
  );
}
