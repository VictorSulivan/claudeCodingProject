import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 48,
    color: "#1e293b",
  },
  header: {
    marginBottom: 28,
    borderBottom: "2 solid #1e40af",
    paddingBottom: 16,
  },
  mairie: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#0f172a",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    fontSize: 10,
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  longText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  kindBadge: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    padding: "3 8",
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    left: 48,
    right: 48,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
  signatureBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  sigBox: {
    width: "45%",
    borderTop: "1 solid #cbd5e1",
    paddingTop: 8,
  },
  sigLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  sigName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  acknowledgedNote: {
    fontSize: 9,
    color: "#16a34a",
    marginTop: 4,
  },
});

type CustomField = { label: string; value: string };

interface ContractPDFData {
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

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

const KIND_LABELS: Record<string, string> = {
  EMPLOYE: "Contrat de travail",
  CONTRACTANT: "Contrat de prestation",
};

export function ContractPDFTemplate({ contract }: { contract: ContractPDFData }) {
  const customFields: CustomField[] = Array.isArray(contract.customFields)
    ? (contract.customFields as CustomField[])
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.mairie}>Mairie de Highlands</Text>
          <Text style={styles.subtitle}>Document officiel — {fmtDate(contract.createdAt)}</Text>
        </View>

        {/* Titre du document */}
        <Text style={styles.docTitle}>{contract.title}</Text>
        <Text style={styles.kindBadge}>{KIND_LABELS[contract.kind] ?? contract.kind}</Text>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}>
            <Text style={styles.label}>La Mairie, représentée par</Text>
            <Text style={styles.value}>{contract.creator.name ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {contract.kind === "EMPLOYE" ? "L'employé(e)" : "Le/La contractant(e)"}
            </Text>
            <Text style={styles.value}>
              {contract.targetUser.name ?? "—"}
              {contract.targetUser.organization ? ` (${contract.targetUser.organization})` : ""}
            </Text>
          </View>
        </View>

        {/* Durée */}
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

        {/* Spécifique employé */}
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

        {/* Spécifique contractant */}
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

        {/* Rémunération */}
        {(contract.remunerationAmount != null || contract.remunerationNote) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rémunération</Text>
            {contract.remunerationAmount != null && (
              <View style={styles.row}>
                <Text style={styles.label}>Montant</Text>
                <Text style={styles.value}>
                  {contract.remunerationAmount} mornilles
                  {contract.remunerationNote ? ` ${contract.remunerationNote}` : ""}
                </Text>
              </View>
            )}
            {!contract.remunerationAmount && contract.remunerationNote && (
              <Text style={styles.longText}>{contract.remunerationNote}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {contract.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.longText}>{contract.notes}</Text>
          </View>
        )}

        {/* Champs libres */}
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

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Pour la Mairie</Text>
            <Text style={styles.sigName}>{contract.creator.name ?? "—"}</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>
              {contract.kind === "EMPLOYE" ? "L'employé(e)" : "Le/La contractant(e)"}
            </Text>
            <Text style={styles.sigName}>{contract.targetUser.name ?? "—"}</Text>
            {contract.acknowledgedAt && (
              <Text style={styles.acknowledgedNote}>
                Lu et accepté le {fmtDate(contract.acknowledgedAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Mairie de Highlands — Document généré le {fmtDate(new Date())} — Statut : {contract.status}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
