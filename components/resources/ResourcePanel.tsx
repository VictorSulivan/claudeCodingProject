"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProcuredBy { id: string; name?: string | null }
interface ResourceEntry {
  id: string; quantity: number; location?: string | null;
  notes?: string | null; procuredAt: Date | string; procuredBy: ProcuredBy;
}
interface Resource {
  id: string; name: string; description?: string | null;
  quantityNeeded: number; unit?: string | null; entries: ResourceEntry[];
}

interface ResourcePanelProps {
  resources: Resource[];
  eventId: string;
  canManage: boolean;
}

export function ResourcePanel({ resources, eventId, canManage }: ResourcePanelProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New resource form
  const [newRes, setNewRes] = useState({ name: "", description: "", quantityNeeded: "", unit: "" });
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState("");

  // New entry form per resource
  const [newEntry, setNewEntry] = useState<Record<string, { quantity: string; location: string; notes: string; procuredAt: string }>>({});
  const [entryLoading, setEntryLoading] = useState<string | null>(null);
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});

  async function addResource() {
    if (!newRes.name.trim() || !newRes.quantityNeeded) return;
    if (Number(newRes.quantityNeeded) <= 0) {
      setResError("La quantité doit être supérieure à 0");
      return;
    }
    setResError("");
    setResLoading(true);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newRes, name: newRes.name.trim(), eventId }),
    });
    setResLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setResError(data.error ?? "Une erreur est survenue");
      return;
    }
    setNewRes({ name: "", description: "", quantityNeeded: "", unit: "" });
    router.refresh();
  }

  async function addEntry(resourceId: string) {
    const e = newEntry[resourceId];
    if (!e?.quantity) return;
    if (Number(e.quantity) <= 0) {
      setEntryErrors((prev) => ({ ...prev, [resourceId]: "La quantité doit être supérieure à 0" }));
      return;
    }
    setEntryErrors((prev) => ({ ...prev, [resourceId]: "" }));
    setEntryLoading(resourceId);
    const res = await fetch(`/api/resources/${resourceId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: Number(e.quantity),
        location: e.location || null,
        notes: e.notes || null,
        procuredAt: e.procuredAt || undefined,
      }),
    });
    setEntryLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEntryErrors((prev) => ({ ...prev, [resourceId]: data.error ?? "Une erreur est survenue" }));
      return;
    }
    setNewEntry((prev) => ({ ...prev, [resourceId]: { quantity: "", location: "", notes: "", procuredAt: "" } }));
    router.refresh();
  }

  function setEntryField(resourceId: string, field: string, value: string) {
    setNewEntry((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId] ?? { quantity: "", location: "", notes: "", procuredAt: "" }, [field]: value },
    }));
  }

  function quantityProcured(res: Resource) {
    return res.entries.reduce((s, e) => s + e.quantity, 0);
  }

  function progressColor(res: Resource) {
    const pct = quantityProcured(res) / res.quantityNeeded;
    if (pct >= 1) return "bg-green-500";
    if (pct >= 0.5) return "bg-amber-400";
    return "bg-red-400";
  }

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout de ressource */}
      {canManage && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Ajouter une ressource nécessaire</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newRes.name}
                onChange={(e) => setNewRes((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom de la ressource *"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newRes.quantityNeeded}
                  onChange={(e) => setNewRes((f) => ({ ...f, quantityNeeded: e.target.value }))}
                  placeholder="Qté nécessaire *"
                  min="1"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={newRes.unit}
                  onChange={(e) => setNewRes((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="Unité"
                  className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <textarea
              value={newRes.description}
              onChange={(e) => setNewRes((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (type, spécifications, remarques...)"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {resError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{resError}</p>
            )}
            <button
              onClick={addResource}
              disabled={!newRes.name.trim() || !newRes.quantityNeeded || resLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {resLoading ? "Ajout..." : "Ajouter la ressource"}
            </button>
          </div>
        </div>
      )}

      {/* Liste des ressources */}
      <div className="space-y-3">
        {resources.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-400 text-sm">Aucune ressource listée pour cet événement.</p>
          </div>
        )}

        {resources.map((res) => {
          const procured = quantityProcured(res);
          const pct = Math.min(100, Math.round((procured / res.quantityNeeded) * 100));
          const isExpanded = expandedId === res.id;
          const entryForm = newEntry[res.id] ?? { quantity: "", location: "", notes: "", procuredAt: "" };

          return (
            <div key={res.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Resource header */}
              <div
                className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : res.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-slate-800">{res.name}</h5>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          pct >= 100 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {procured}/{res.quantityNeeded} {res.unit ?? ""}
                      </span>
                    </div>
                    {res.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{res.description}</p>
                    )}
                    {/* Barre de progression */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(res)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{pct}%</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Journal d'approvisionnement */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  {/* Historique */}
                  <div>
                    <h6 className="text-sm font-semibold text-slate-600 mb-3">
                      Journal d&apos;approvisionnement ({res.entries.length} entrée(s))
                    </h6>
                    {res.entries.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucun approvisionnement enregistré.</p>
                    ) : (
                      <div className="space-y-2">
                        {res.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-green-700">+{entry.quantity}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-700">
                                  {entry.procuredBy.name ?? "—"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(entry.procuredAt).toLocaleDateString("fr", {
                                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                  })}
                                </span>
                                {entry.quantity} {res.unit ?? ""}
                              </div>
                              {entry.location && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  📍 Stocké : <span className="font-medium">{entry.location}</span>
                                </p>
                              )}
                              {entry.notes && (
                                <p className="text-xs text-slate-400 mt-0.5 italic">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formulaire d'ajout d'entrée */}
                  <div className="border-t border-slate-100 pt-4">
                    <h6 className="text-sm font-semibold text-slate-600 mb-3">Enregistrer un approvisionnement</h6>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={entryForm.quantity}
                          onChange={(e) => setEntryField(res.id, "quantity", e.target.value)}
                          placeholder={`Qté ${res.unit ? `(${res.unit})` : ""} *`}
                          min="1"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          value={entryForm.location}
                          onChange={(e) => setEntryField(res.id, "location", e.target.value)}
                          placeholder="Lieu de stockage (ex: coffre n°7)"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="datetime-local"
                          value={entryForm.procuredAt}
                          onChange={(e) => setEntryField(res.id, "procuredAt", e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <textarea
                        value={entryForm.notes}
                        onChange={(e) => setEntryField(res.id, "notes", e.target.value)}
                        placeholder="Notes supplémentaires..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      {entryErrors[res.id] && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                          {entryErrors[res.id]}
                        </p>
                      )}
                      <button
                        onClick={() => addEntry(res.id)}
                        disabled={!entryForm.quantity || entryLoading === res.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {entryLoading === res.id ? "Enregistrement..." : "Enregistrer l'approvisionnement"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
