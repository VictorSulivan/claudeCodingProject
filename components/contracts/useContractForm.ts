"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatParisDateTime } from "@/lib/date-paris";

export type CustomField = { label: string; value: string };

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

export function useContractForm(initial?: ContractFormData) {
  const router = useRouter();
  const isEditing = !!initial?.id;

  const [kind, setKind] = useState<"EMPLOYE" | "CONTRACTANT">(initial?.kind ?? "EMPLOYE");
  const [customFields, setCustomFields] = useState<CustomField[]>(initial?.customFields ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setFormState] = useState({
    title: initial?.title ?? "",
    targetUserId: initial?.targetUserId ?? "",
    startDate: initial?.startDate ? formatParisDateTime(new Date(initial.startDate)) : "",
    endDate: initial?.endDate ? formatParisDateTime(new Date(initial.endDate)) : "",
    jobTitle: initial?.jobTitle ?? "",
    contractType: initial?.contractType ?? "",
    serviceDescription: initial?.serviceDescription ?? "",
    deliverables: initial?.deliverables ?? "",
    remunerationAmount: initial?.remunerationAmount?.toString() ?? "",
    remunerationNote: initial?.remunerationNote ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setFormState((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(
    e: React.FormEvent,
    onSaved?: (contract: ContractFormData) => void,
  ) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.startDate || !form.targetUserId) {
      setError("Titre, date de début et destinataire sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const url = isEditing ? `/api/contracts/${initial!.id}` : "/api/contracts";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          kind,
          customFields,
          remunerationAmount: form.remunerationAmount ? parseFloat(form.remunerationAmount) : null,
          endDate: form.endDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur lors de la sauvegarde."); return; }
      if (onSaved) { onSaved(data); } else { router.push(`/dashboard/contracts/${data.id}`); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  return { kind, setKind, form, set, customFields, setCustomFields, loading, error, isEditing, handleSubmit };
}
