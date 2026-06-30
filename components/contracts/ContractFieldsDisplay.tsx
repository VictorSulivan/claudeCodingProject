"use client";

type CustomField = { label: string; value: string };

type Contract = {
  kind: "EMPLOYE" | "CONTRACTANT";
  startDate: string;
  endDate?: string | null;
  jobTitle?: string | null;
  contractType?: string | null;
  serviceDescription?: string | null;
  deliverables?: string | null;
  remunerationAmount?: number | null;
  remunerationNote?: string | null;
  notes?: string | null;
  creator: { name?: string | null };
  targetUser: { name?: string | null; organization?: string | null };
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
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

const card = "bg-white rounded-xl border border-slate-200 p-6 space-y-3";
const sectionTitle = "font-semibold text-slate-700 text-sm uppercase tracking-wide";

export function ContractFieldsDisplay({ contract, customFields }: { contract: Contract; customFields: CustomField[] }) {
  return (
    <>
      <div className={card}>
        <h2 className={sectionTitle}>Parties</h2>
        <Field label="La Mairie, représentée par" value={contract.creator.name} />
        <Field
          label={contract.kind === "EMPLOYE" ? "L'employé(e)" : "Le/La contractant(e)"}
          value={contract.targetUser.name + (contract.targetUser.organization ? ` — ${contract.targetUser.organization}` : "")}
        />
      </div>

      <div className={card}>
        <h2 className={sectionTitle}>Durée</h2>
        <Field label="Date de début" value={fmtDate(contract.startDate)} />
        <Field label="Date de fin" value={fmtDate(contract.endDate)} />
      </div>

      {contract.kind === "EMPLOYE" && (contract.jobTitle || contract.contractType) && (
        <div className={card}>
          <h2 className={sectionTitle}>Poste</h2>
          <Field label="Intitulé du poste" value={contract.jobTitle} />
          <Field label="Type de contrat" value={contract.contractType} />
        </div>
      )}

      {contract.kind === "CONTRACTANT" && (contract.serviceDescription || contract.deliverables) && (
        <div className={card}>
          <h2 className={sectionTitle}>Prestation</h2>
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

      {(contract.remunerationAmount != null || contract.remunerationNote) && (
        <div className={card}>
          <h2 className={sectionTitle}>Rémunération</h2>
          {contract.remunerationAmount != null && (
            <Field label="Montant" value={`${contract.remunerationAmount} mornilles${contract.remunerationNote ? ` ${contract.remunerationNote}` : ""}`} />
          )}
          {!contract.remunerationAmount && contract.remunerationNote && (
            <Field label="Note" value={contract.remunerationNote} />
          )}
        </div>
      )}

      {contract.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className={sectionTitle + " mb-3"}>Notes</h2>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{contract.notes}</p>
        </div>
      )}

      {customFields.length > 0 && (
        <div className={card}>
          <h2 className={sectionTitle}>Informations complémentaires</h2>
          {customFields.map((f, i) => <Field key={i} label={f.label} value={f.value} />)}
        </div>
      )}
    </>
  );
}
