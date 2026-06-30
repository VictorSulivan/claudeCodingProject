"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface Props {
  contract: Contract;
  currentUserId: string;
  canManage: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-slate-100 text-slate-600",
  ENVOYE: "bg-amber-100 text-amber-700",
  ACCEPTE: "bg-green-100 text-green-700",
  TERMINE: "bg-blue-100 text-blue-700",
  ANNULE: "bg-red-100 text-red-600",
};

const KIND_LABELS: Record<string, string> = {
  EMPLOYE: "Contrat de travail",
  CONTRACTANT: "Contrat de prestation",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-sm font-medium text-slate-500 w-48 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

export default function ContractDetail({ contract, currentUserId, canManage }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isCreator = contract.creatorId === currentUserId;
  const isTarget = contract.targetUserId === currentUserId;
  const canEdit = (isCreator || canManage) && contract.status === "BROUILLON";
  const canSend = (isCreator || canManage) && contract.status === "BROUILLON";
  const canAccept = isTarget && contract.status === "ENVOYE";
  const canDownload = contract.status !== "BROUILLON" || isCreator || canManage;
  const canDelete = (isCreator || canManage) && contract.status === "BROUILLON";

  const customFields: CustomField[] = Array.isArray(contract.customFields)
    ? (contract.customFields as CustomField[])
    : [];

  async function action(path: string, label: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setError("");
    setLoading(label);
    try {
      const res = await fetch(`/api/contracts/${contract.id}${path}`, {
        method: path === "" ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* En-tête */}
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

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {canDownload && (
              <a
                href={`/api/contracts/${contract.id}/pdf`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Télécharger PDF
              </a>
            )}
            {canSend && (
              <button
                onClick={() => action("/send", "send", "Envoyer ce contrat au destinataire ?")}
                disabled={loading === "send"}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading === "send" ? "Envoi…" : "Envoyer"}
              </button>
            )}
            {canAccept && (
              <button
                onClick={() => action("/accept", "accept", "Confirmer la lecture et l'acceptation du contrat ?")}
                disabled={loading === "accept"}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading === "accept" ? "Confirmation…" : "Lu et accepté"}
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
              >
                Modifier
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => action("", "delete", "Supprimer définitivement ce contrat ?")}
                disabled={loading === "delete"}
                className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {loading === "delete" ? "Suppression…" : "Supprimer"}
              </button>
            )}
          </div>
        </div>

        {/* Accusé de réception */}
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

      {/* Parties */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Parties</h2>
        <Field label="La Mairie, représentée par" value={contract.creator.name} />
        <Field
          label={contract.kind === "EMPLOYE" ? "L'employé(e)" : "Le/La contractant(e)"}
          value={
            contract.targetUser.name +
            (contract.targetUser.organization ? ` — ${contract.targetUser.organization}` : "")
          }
        />
      </div>

      {/* Durée */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Durée</h2>
        <Field label="Date de début" value={fmtDate(contract.startDate)} />
        <Field label="Date de fin" value={fmtDate(contract.endDate)} />
      </div>

      {/* Spécifique employé */}
      {contract.kind === "EMPLOYE" && (contract.jobTitle || contract.contractType) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Poste</h2>
          <Field label="Intitulé du poste" value={contract.jobTitle} />
          <Field label="Type de contrat" value={contract.contractType} />
        </div>
      )}

      {/* Spécifique contractant */}
      {contract.kind === "CONTRACTANT" && (contract.serviceDescription || contract.deliverables) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Prestation</h2>
          {contract.serviceDescription && (
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{contract.serviceDescription}</p>
            </div>
          )}
          {contract.deliverables && (
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Livrables</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{contract.deliverables}</p>
            </div>
          )}
        </div>
      )}

      {/* Rémunération */}
      {(contract.remunerationAmount != null || contract.remunerationNote) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Rémunération</h2>
          {contract.remunerationAmount != null && (
            <Field
              label="Montant"
              value={`${contract.remunerationAmount} mornilles${contract.remunerationNote ? ` ${contract.remunerationNote}` : ""}`}
            />
          )}
          {!contract.remunerationAmount && contract.remunerationNote && (
            <Field label="Note" value={contract.remunerationNote} />
          )}
        </div>
      )}

      {/* Notes */}
      {contract.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Notes</h2>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{contract.notes}</p>
        </div>
      )}

      {/* Champs libres */}
      {customFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Informations complémentaires
          </h2>
          {customFields.map((f, i) => (
            <Field key={i} label={f.label} value={f.value} />
          ))}
        </div>
      )}
    </div>
  );
}
