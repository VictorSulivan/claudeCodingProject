"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContractActions } from "./ContractActions";
import { ContractFieldsDisplay } from "./ContractFieldsDisplay";

type User = { id: string; name?: string | null; role: string; organization?: string | null };
type CustomField = { label: string; value: string };

type Contract = {
  id: string;
  kind: "EMPLOYE" | "CONTRACTANT";
  status: "BROUILLON" | "ENVOYE" | "ACCEPTE" | "TERMINE" | "ANNULE";
  title: string;
  startDate: string;
  endDate?: string | null;
  jobTitle?: string | null;
  contractType?: string | null;
  serviceDescription?: string | null;
  deliverables?: string | null;
  remunerationAmount?: number | null;
  remunerationNote?: string | null;
  notes?: string | null;
  customFields?: CustomField[];
  acknowledgedAt?: string | null;
  createdAt: string;
  creatorId: string;
  targetUserId: string;
  creator: User;
  targetUser: User;
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon", ENVOYE: "Envoyé", ACCEPTE: "Accepté", TERMINE: "Terminé", ANNULE: "Annulé",
};
const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-slate-100 text-slate-600", ENVOYE: "bg-amber-100 text-amber-700",
  ACCEPTE: "bg-green-100 text-green-700", TERMINE: "bg-blue-100 text-blue-700", ANNULE: "bg-red-100 text-red-600",
};
const KIND_LABELS: Record<string, string> = {
  EMPLOYE: "Contrat de travail", CONTRACTANT: "Contrat de prestation",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export default function ContractDetail({ contract, currentUserId, canManage }: {
  contract: Contract; currentUserId: string; canManage: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isCreator = contract.creatorId === currentUserId;
  const isTarget = contract.targetUserId === currentUserId;

  const customFields: CustomField[] = Array.isArray(contract.customFields)
    ? (contract.customFields as CustomField[]) : [];

  async function action(path: string, label: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setError(""); setLoading(label);
    try {
      const res = await fetch(`/api/contracts/${contract.id}${path}`, {
        method: path === "" ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      router.refresh();
    } finally { setLoading(null); }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[contract.status]}`}>
                {STATUS_LABELS[contract.status]}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                {KIND_LABELS[contract.kind]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">{contract.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Rédigé le {fmtDate(contract.createdAt)} par {contract.creator.name ?? "—"}
            </p>
          </div>
          <ContractActions
            contractId={contract.id}
            canDownload={contract.status !== "BROUILLON" || isCreator || canManage}
            canSend={(isCreator || canManage) && contract.status === "BROUILLON"}
            canAccept={isTarget && contract.status === "ENVOYE"}
            canEdit={(isCreator || canManage) && contract.status === "BROUILLON"}
            canDelete={(isCreator || canManage) && contract.status === "BROUILLON"}
            loading={loading}
            onSend={() => action("/send", "send", "Envoyer ce contrat au destinataire ?")}
            onAccept={() => action("/accept", "accept", "Confirmer la lecture et l'acceptation du contrat ?")}
            onEdit={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
            onDelete={() => action("", "delete", "Supprimer définitivement ce contrat ?")}
          />
        </div>

        {contract.acknowledgedAt && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
            Lu et accepté par {contract.targetUser.name} le {fmtDate(contract.acknowledgedAt)}
          </div>
        )}
        {contract.status === "ENVOYE" && !contract.acknowledgedAt && isTarget && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
            Ce contrat attend votre accusé de réception.
          </div>
        )}
      </div>

      <ContractFieldsDisplay contract={contract} customFields={customFields} />
    </div>
  );
}
