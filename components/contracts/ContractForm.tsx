"use client";

import { useRouter } from "next/navigation";
import { useContractForm } from "./useContractForm";
import type { CustomField } from "./useContractForm";
import { CustomFieldsEditor } from "./CustomFieldsEditor";
import { EmployeFields } from "./EmployeFields";
import { ContractantFields } from "./ContractantFields";

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

type User = { id: string; name?: string | null; role: string; organization?: string | null };

interface Props {
  allUsers: User[];
  initial?: ContractFormData;
  onSaved?: (contract: ContractFormData) => void;
}

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function ContractForm({ allUsers, initial, onSaved }: Props) {
  const router = useRouter();
  const { kind, setKind, form, set, customFields, setCustomFields, loading, error, isEditing, handleSubmit } =
    useContractForm(initial);

  const eligibleUsers = allUsers.filter((u) =>
    kind === "EMPLOYE" ? u.role === "EMPLOYEE" : u.role === "CONTRACTANT"
  );

  return (
    <form onSubmit={(e) => handleSubmit(e, onSaved)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {!isEditing && (
        <div>
          <label className={labelCls}>Type de contrat</label>
          <div className="flex gap-3">
            {(["EMPLOYE", "CONTRACTANT"] as const).map((k) => (
              <button key={k} type="button" onClick={() => { setKind(k); set("targetUserId", ""); }}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  kind === k ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {k === "EMPLOYE" ? "Contrat de travail (Employé)" : "Contrat de prestation (Contractant)"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Titre du contrat *</label>
        <input type="text" required value={form.title} onChange={(e) => set("title", e.target.value)}
          className={inputCls} placeholder="ex: Contrat CDI — Agent d'entretien" />
      </div>

      <div>
        <label className={labelCls}>{kind === "EMPLOYE" ? "Employé(e)" : "Contractant(e)"} *</label>
        <select required value={form.targetUserId} onChange={(e) => set("targetUserId", e.target.value)}
          className={inputCls} disabled={isEditing}>
          <option value="">— Sélectionner —</option>
          {eligibleUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name ?? u.id}{u.organization ? ` (${u.organization})` : ""}</option>
          ))}
        </select>
        {eligibleUsers.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Aucun {kind === "EMPLOYE" ? "employé" : "contractant"} enregistré.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date de début *</label>
          <input type="datetime-local" required value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Date de fin</label>
          <input type="datetime-local" value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
        </div>
      </div>

      {kind === "EMPLOYE" && (
        <EmployeFields jobTitle={form.jobTitle} contractType={form.contractType}
          set={(k, v) => set(k as keyof typeof form, v)} inputCls={inputCls} labelCls={labelCls} />
      )}
      {kind === "CONTRACTANT" && (
        <ContractantFields serviceDescription={form.serviceDescription} deliverables={form.deliverables}
          set={(k, v) => set(k as keyof typeof form, v)} inputCls={inputCls} labelCls={labelCls} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Rémunération (mornilles){kind === "EMPLOYE" ? " — par demi-heure" : ""}</label>
          <input type="number" step="0.01" min="0" value={form.remunerationAmount}
            onChange={(e) => set("remunerationAmount", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className={labelCls}>Précision rémunération</label>
          <input type="text" value={form.remunerationNote}
            onChange={(e) => set("remunerationNote", e.target.value)} className={inputCls}
            placeholder={kind === "EMPLOYE" ? "par demi-heure" : "forfait global"} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)}
          className={inputCls} placeholder="Informations complémentaires…" />
      </div>

      <CustomFieldsEditor fields={customFields} onChange={setCustomFields} inputCls={inputCls} labelCls={labelCls} />

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? "Enregistrement…" : isEditing ? "Enregistrer les modifications" : "Créer le contrat"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}
