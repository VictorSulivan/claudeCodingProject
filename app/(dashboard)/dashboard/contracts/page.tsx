import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { can } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";
import Link from "next/link";

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
  EMPLOYE: "Travail",
  CONTRACTANT: "Prestation",
};

export default async function ContractsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  const userId = session.user.id;
  const canCreate = can(role, "contracts:create");
  const canManage = can(role, "contracts:manage");

  const where = canManage
    ? {}
    : { OR: [{ creatorId: userId }, { targetUserId: userId }] };

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      creator: { select: { name: true } },
      targetUser: { select: { name: true, organization: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const groups = {
    BROUILLON: contracts.filter((c) => c.status === "BROUILLON"),
    ENVOYE: contracts.filter((c) => c.status === "ENVOYE"),
    ACCEPTE: contracts.filter((c) => c.status === "ACCEPTE"),
    TERMINE: contracts.filter((c) => c.status === "TERMINE"),
    ANNULE: contracts.filter((c) => c.status === "ANNULE"),
  };

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Contrats" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">{contracts.length} contrat(s)</p>
          {canCreate && (
            <Link
              href="/dashboard/contracts/new"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nouveau contrat
            </Link>
          )}
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucun contrat pour le moment.</p>
            {canCreate && (
              <Link href="/dashboard/contracts/new" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                Créer le premier contrat
              </Link>
            )}
          </div>
        )}

        {(["ENVOYE", "BROUILLON", "ACCEPTE", "TERMINE", "ANNULE"] as const).map((status) => {
          const list = groups[status];
          if (list.length === 0) return null;
          return (
            <section key={status}>
              <h3 className={`font-semibold mb-3 text-sm ${status === "ANNULE" ? "text-slate-400" : "text-slate-700"}`}>
                {STATUS_LABELS[status]} ({list.length})
              </h3>
              <div className="grid gap-3">
                {list.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/contracts/${c.id}`}
                    className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {KIND_LABELS[c.kind]}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 mt-1 truncate">{c.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {c.targetUser.name ?? "—"}
                        {c.targetUser.organization ? ` · ${c.targetUser.organization}` : ""}
                        {" · "}
                        {new Date(c.startDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Europe/Paris",
                        })}
                        {c.endDate
                          ? ` → ${new Date(c.endDate).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "Europe/Paris",
                            })}`
                          : ""}
                      </p>
                    </div>
                    {c.acknowledgedAt && (
                      <span className="text-xs text-green-600 flex-shrink-0">Lu et accepté</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
