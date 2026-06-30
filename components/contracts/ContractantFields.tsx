"use client";

interface Props {
  serviceDescription: string;
  deliverables: string;
  set: (k: string, v: string) => void;
  inputCls: string;
  labelCls: string;
}

export function ContractantFields({ serviceDescription, deliverables, set, inputCls, labelCls }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Description de la prestation</label>
        <textarea rows={3} value={serviceDescription}
          onChange={(e) => set("serviceDescription", e.target.value)}
          className={inputCls} placeholder="Décrire le service fourni par le contractant…"
        />
      </div>
      <div>
        <label className={labelCls}>Livrables attendus</label>
        <textarea rows={3} value={deliverables}
          onChange={(e) => set("deliverables", e.target.value)}
          className={inputCls} placeholder="Liste des livrables ou jalons…"
        />
      </div>
    </div>
  );
}
