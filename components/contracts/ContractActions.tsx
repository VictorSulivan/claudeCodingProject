"use client";

interface Props {
  contractId: string;
  canDownload: boolean;
  canSend: boolean;
  canAccept: boolean;
  canEdit: boolean;
  canDelete: boolean;
  loading: string | null;
  onSend: () => void;
  onAccept: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContractActions({ contractId, canDownload, canSend, canAccept, canEdit, canDelete, loading, onSend, onAccept, onEdit, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {canDownload && (
        <a href={`/api/contracts/${contractId}/pdf`}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center">
          Télécharger PDF
        </a>
      )}
      {canSend && (
        <button onClick={onSend} disabled={loading === "send"}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading === "send" ? "Envoi…" : "Envoyer"}
        </button>
      )}
      {canAccept && (
        <button onClick={onAccept} disabled={loading === "accept"}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading === "accept" ? "Confirmation…" : "Lu et accepté"}
        </button>
      )}
      {canEdit && (
        <button onClick={onEdit}
          className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors">
          Modifier
        </button>
      )}
      {canDelete && (
        <button onClick={onDelete} disabled={loading === "delete"}
          className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
          {loading === "delete" ? "Suppression…" : "Supprimer"}
        </button>
      )}
    </div>
  );
}
