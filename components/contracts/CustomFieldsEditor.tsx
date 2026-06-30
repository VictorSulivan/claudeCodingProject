"use client";

import type { CustomField } from "./useContractForm";

interface Props {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  inputCls: string;
  labelCls: string;
}

export function CustomFieldsEditor({ fields, onChange, inputCls, labelCls }: Props) {
  const add = () => onChange([...fields, { label: "", value: "" }]);
  const update = (i: number, key: "label" | "value", v: string) =>
    onChange(fields.map((f, idx) => (idx === i ? { ...f, [key]: v } : f)));
  const remove = (i: number) => onChange(fields.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls + " mb-0"}>Champs supplémentaires</label>
        <button type="button" onClick={add} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          + Ajouter un champ
        </button>
      </div>
      {fields.length === 0 && <p className="text-xs text-slate-400">Aucun champ supplémentaire.</p>}
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text" placeholder="Intitulé" value={f.label}
              onChange={(e) => update(i, "label", e.target.value)}
              className={inputCls + " w-2/5"}
            />
            <input
              type="text" placeholder="Valeur" value={f.value}
              onChange={(e) => update(i, "value", e.target.value)}
              className={inputCls + " flex-1"}
            />
            <button type="button" onClick={() => remove(i)} className="px-2 text-red-400 hover:text-red-600 text-lg" title="Supprimer">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
