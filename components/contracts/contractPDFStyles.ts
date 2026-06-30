import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 11, padding: 48, color: "#1e293b" },
  header: { marginBottom: 28, borderBottom: "2 solid #1e40af", paddingBottom: 16 },
  mairie: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1e40af", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#64748b" },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 24, color: "#0f172a" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e40af",
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 6, borderBottom: "1 solid #e2e8f0", paddingBottom: 3,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: "35%", fontFamily: "Helvetica-Bold", color: "#475569", fontSize: 10 },
  value: { flex: 1, fontSize: 10 },
  longText: { fontSize: 10, lineHeight: 1.5, marginBottom: 4 },
  kindBadge: {
    backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "3 8",
    borderRadius: 4, fontSize: 9, fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start", marginBottom: 12,
  },
  footer: { position: "absolute", bottom: 48, left: 48, right: 48, borderTop: "1 solid #e2e8f0", paddingTop: 10 },
  footerText: { fontSize: 9, color: "#94a3b8", textAlign: "center" },
  signatureBlock: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  sigBox: { width: "45%", borderTop: "1 solid #cbd5e1", paddingTop: 8 },
  sigLabel: { fontSize: 9, color: "#64748b", marginBottom: 4 },
  sigName: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  acknowledgedNote: { fontSize: 9, color: "#16a34a", marginTop: 4 },
});

export const KIND_LABELS: Record<string, string> = {
  EMPLOYE: "Contrat de travail",
  CONTRACTANT: "Contrat de prestation",
};

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Paris",
  });
}
