"use client";

const CONTRACT_TYPES = ["CDI", "CDD", "Titulaire", "Stagiaire", "Vacation", "Autre"];

interface Props {
  jobTitle: string;
  contractType: string;
  set: (k: string, v: string) => void;
  inputCls: string;
  labelCls: string;
}

export function EmployeFields({ jobTitle, contractType, set, inputCls, labelCls }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Intitulé du poste</label>
        <input
          type="text" value={jobTitle}
          onChange={(e) => set("jobTitle", e.target.value)}
          className={inputCls} placeholder="ex: Agent technique"
        />
      </div>
      <div>
        <label className={labelCls}>Type de contrat</label>
        <select value={contractType} onChange={(e) => set("contractType", e.target.value)} className={inputCls}>
          <option value="">— Sélectionner —</option>
          {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}
