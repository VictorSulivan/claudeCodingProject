import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { styles, KIND_LABELS, fmtDate } from "./contractPDFStyles";

type CustomField = { label: string; value: string };

export interface ContractPDFData {
  title: string;
  kind: "EMPLOYE" | "CONTRACTANT";
  status: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  creator: { name?: string | null; role: string };
  targetUser: { name?: string | null; role: string; organization?: string | null };
  jobTitle?: string | null;
  contractType?: string | null;
  serviceDescription?: string | null;
  deliverables?: string | null;
  remunerationAmount?: number | null;
  remunerationNote?: string | null;
  notes?: string | null;
  customFields?: CustomField[];
  acknowledgedAt?: Date | string | null;
  createdAt: Date | string;
}

export function ContractPDFTemplate({ contract }: { contract: ContractPDFData }) {
  const customFields: CustomField[] = Array.isArray(contract.customFields)
    ? (contract.customFields as CustomField[]) : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.mairie}>Mairie de Highlands</Text>
          <Text style={styles.subtitle}>Document officiel — {fmtDate(contract.createdAt)}</Text>
        </View>

        <Text style={styles.docTitle}>{contract.title}</Text>
        <Text style={styles.kindBadge}>{KIND_LABELS[contract.kind] ?? contract.kind}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}>
            <Text style={styles.label}>La Mairie, représentée par</Text>
            <Text style={styles.value}>{contract.creator.name ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{contract.kind === "EMPLOYE" ? "L'employé(e)" : "Le/La contractant(e)"}</Text>
            <Text style={styles.value}>
              {contract.targetUser.name ?? "—"}
              {contract.targetUser.organization ? ` (${contract.targetUser.organization})` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durée</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date de début</Text>
            <Text style={styles.value}>{fmtDate(contract.startDate)}</Text>
          </View>
          {contract.endDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Date de fin</Text>
              <Text style={styles.value}>{fmtDate(contract.endDate)}</Text>
            </View>
          )}
        </View>

        {contract.kind === "EMPLOYE" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Poste</Text>
            {contract.jobTitle && (
              <View style={styles.row}>
                <Text style={styles.label}>Intitulé du poste</Text>
                <Text style={styles.value}>{contract.jobTitle}</Text>
              </View>
            )}
            {contract.contractType && (
              <View style={styles.row}>
                <Text style={styles.label}>Type de contrat</Text>
                <Text style={styles.value}>{contract.contractType}</Text>
              </View>
            )}
          </View>
        )}

        {contract.kind === "CONTRACTANT" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prestation</Text>
            {contract.serviceDescription && (
              <>
                <Text style={{ ...styles.label, marginBottom: 3 }}>Description</Text>
                <Text style={styles.longText}>{contract.serviceDescription}</Text>
              </>
            )}
            {contract.deliverables && (
              <>
                <Text style={{ ...styles.label, marginBottom: 3, marginTop: 6 }}>Livrables</Text>
                <Text style={styles.longText}>{contract.deliverables}</Text>
              </>
            )}
          </View>
        )}

        {(contract.remunerationAmount != null || contract.remunerationNote) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rémunération</Text>
            {contract.remunerationAmount != null && (
              <View style={styles.row}>
                <Text style={styles.label}>Montant</Text>
                <Text style={styles.value}>
                  {contract.remunerationAmount} mornilles{contract.remunerationNote ? ` ${contract.remunerationNote}` : ""}
                </Text>
              </View>
            )}
            {!contract.remunerationAmount && contract.remunerationNote && (
              <Text style={styles.longText}>{contract.remunerationNote}</Text>
            )}
          </View>
        )}

        {contract.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.longText}>{contract.notes}</Text>
          </View>
        )}

        {customFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations complémentaires</Text>
            {customFields.map((f, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{f.label}</Text>
                <Text style={styles.value}>{f.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.signatureBlock}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Pour la Mairie</Text>
            <Text style={styles.sigName}>{contract.creator.name ?? "—"}</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>{contract.kind === "EMPLOYE" ? "L'employé(e)" : "Le/La contractant(e)"}</Text>
            <Text style={styles.sigName}>{contract.targetUser.name ?? "—"}</Text>
            {contract.acknowledgedAt && (
              <Text style={styles.acknowledgedNote}>Lu et accepté le {fmtDate(contract.acknowledgedAt)}</Text>
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Mairie de Highlands — Document généré le {fmtDate(new Date())} — Statut : {contract.status}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function buildContractDocument(contract: ContractPDFData): React.ReactElement<DocumentProps> {
  return React.createElement(ContractPDFTemplate, { contract }) as React.ReactElement<DocumentProps>;
}
