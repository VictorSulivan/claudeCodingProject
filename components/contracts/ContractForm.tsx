"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatParisDateTime } from "@/lib/date-paris";

type User = {
  id: string;
  name?: string | null;
  role: string;
  organization?: string | null;
};

type CustomField = { label: string; value: string };

type ContractFormData = {
  id?: string;
  kind?: "EMPLOYE" | "CONTRACTANT";
  title?: string;
  startDate?: string | Date;
  endDate?: string | Date | null;
  targetUserId?: string;
  jobTitle?: string | null;
  contractType?: string | null;
  serviceDescription?: string | null;
  deliverables?: string | null;
  remunerationAmount?: number | null;
  remunerationNote?: string | null;
  notes?: string | null;
  customFields?: CustomField[];
};

interface Props {
  allUsers: User[];
  initial?: ContractFormData;
  onSaved?: (contract: ContractFormData) => void;
}

const CONTRACT_TYPES = ["CDI", "CDD", "Titulaire", "Stagiaire", "Vacation", "Autre"];

export default function ContractForm({ allUsers, initial, onSaved }: Props) {
  const router = useRouter();
  const isEditing = !!initial?.id;

  const [kind, setKind] = useState<"EMPLOYE" | "CONTRACTANT">(
    initial?.kind ?? "EMPLOYE"
  );
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    targetUserId: initial?.targetUserId ?? "",
    startDate: initial?.startDate
      ? formatParisDateTime(new Date(initial.startDate))
      : "",
    endDate: initial?.endDate
      ? formatParisDateTime(new Date(initial.endDate))
      : "",
    // Employé
    jobTitle: initial?.jobTitle ?? "",
    contractType: initial?.contractType ?? "",
    // Contractant
    serviceDescription: initial?.serviceDescription ?? "",
    deliverables: initial?.deliverables ?? "",
    // Rémunération
    remunerationAmount: initial?.remunerationAmount?.toString() ?? "",
    remunerationNote: initial?.remunerationNote ?? "",
    // Notes
    notes: initial?.notes ?? "",
  });
  const [customFields, setCustomFields] = useState<CustomField[]>(
    initial?.customFields ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const addCustomField = () =>
    setCustomFields((prev) => [...prev, { label: "", value: "" }]);

  const updateCustomField = (i: number, key: "label" | "value", v: string) =>
    setCustomFields((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [key]: v } : f))
    );

  const removeCustomField = (i: number) =>
    setCustomFields((prev) => prev.filter((_, idx) => idx !== i));

  const eligibleUsers = allUsers.filter((u) =>
    kind === "EMPLOYE" ? u.role === "EMPLOYEE" : u.role === "CONTRACTANT"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.startDate || !form.targetUserId) {
      setError("Titre, date de début et destinataire sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/contracts/${initial!.id}`
        : "/api/contracts";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        ...form,
        kind,
        customFields,
        remunerationAmount: form.remunerationAmount
          ? parseFloat(form.remunerationAmount)
          : null,
        endDate: form.endDate || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la sauvegarde.");
        return;
      }

      if (onSaved) {
        onSaved(data);
      } else {
        router.push(`/dashboard/contracts/${data.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Type de contrat */}
      {!isEditing && (
        <div>
          <label className={labelCls}>Type de contrat</label>
          <div className="flex gap-3">
            {(["EMPLOYE", "CONTRACTANT"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); set("targetUserId", ""); }}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  kind === k
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {k === "EMPLOYE" ? "Contrat de travail (Employé)" : "Contrat de prestation (Contractant)"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Titre */}
      <div>
        <label className={labelCls}>Titre du contrat *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputCls}
          placeholder="ex: Contrat CDI — Agent d'entretien"
        />
      </div>

      {/* Destinataire */}
      <div>
        <label className={labelCls}>
          {kind === "EMPLOYE" ? "Employé(e)" : "Contractant(e)"} *
        </label>
        <select
          required
          value={form.targetUserId}
          onChange={(e) => set("targetUserId", e.target.value)}
          className={inputCls}
          disabled={isEditing}
        >
          <option value="">— Sélectionner —</option>
          {eligibleUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.id}
              {u.organization ? ` (${u.organization})` : ""}
            </option>
          ))}
        </select>
        {eligibleUsers.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Aucun {kind === "EMPLOYE" ? "employé" : "contractant"} enregistré.
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date de début *</label>
          <input
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Date de fin</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Champs employé */}
      {kind === "EMPLOYE" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Intitulé du poste</label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              className={inputCls}
              placeholder="ex: Agent technique"
            />
          </div>
          <div>
            <label className={labelCls}>Type de contrat</label>
            <select
              value={form.contractType}
              onChange={(e) => set("contractType", e.target.value)}
              className={inputCls}
            >
              <option value="">— Sélectionner —</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Champs contractant */}
      {kind === "CONTRACTANT" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Description de la prestation</label>
            <textarea
              rows={3}
              value={form.serviceDescription}
              onChange={(e) => set("serviceDescription", e.target.value)}
              className={inputCls}
              placeholder="Décrire le service fourni par le contractant…"
            />
          </div>
          <div>
            <label className={labelCls}>Livrables attendus</label>
            <textarea
              rows={3}
              value={form.deliverables}
              onChange={(e) => set("deliverables", e.target.value)}
              className={inputCls}
              placeholder="Liste des livrables ou jalons…"
            />
          </div>
        </div>
      )}

      {/* Rémunération */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Rémunération (mornilles){kind === "EMPLOYE" ? " — par demi-heure" : ""}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.remunerationAmount}
            onChange={(e) => set("remunerationAmount", e.target.value)}
            className={inputCls}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelCls}>Précision rémunération</label>
          <input
            type="text"
            value={form.remunerationNote}
            onChange={(e) => set("remunerationNote", e.target.value)}
            className={inputCls}
            placeholder={kind === "EMPLOYE" ? "par demi-heure" : "forfait global"}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={inputCls}
          placeholder="Informations complémentaires…"
        />
      </div>

      {/* Champs libres */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + " mb-0"}>Champs supplémentaires</label>
          <button
            type="button"
            onClick={addCustomField}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Ajouter un champ
          </button>
        </div>
        {customFields.length === 0 && (
          <p className="text-xs text-slate-400">Aucun champ supplémentaire.</p>
        )}
        <div className="space-y-2">
          {customFields.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="Intitulé"
                value={f.label}
                onChange={(e) => updateCustomField(i, "label", e.target.value)}
                className={inputCls + " w-2/5"}
              />
              <input
                type="text"
                placeholder="Valeur"
                value={f.value}
                onChange={(e) => updateCustomField(i, "value", e.target.value)}
                className={inputCls + " flex-1"}
              />
              <button
                type="button"
                onClick={() => removeCustomField(i)}
                className="px-2 text-red-400 hover:text-red-600 text-lg"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading
            ? "Enregistrement…"
            : isEditing
            ? "Enregistrer les modifications"
            : "Créer le contrat"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
