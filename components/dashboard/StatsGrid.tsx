import Link from "next/link";

export type StatVariant = "default" | "warning" | "danger" | "purple";

export type Stat = {
  label: string;
  value: number;
  href: string;
  variant: StatVariant;
};

const VARIANT_STYLES: Record<StatVariant, { card: string; value: string }> = {
  default: {
    card: "hover:border-blue-300",
    value: "text-slate-800",
  },
  warning: {
    card: "border-amber-200 bg-amber-50 hover:border-amber-300",
    value: "text-amber-700",
  },
  danger: {
    card: "border-red-200 bg-red-50 hover:border-red-300",
    value: "text-red-700",
  },
  purple: {
    card: "border-purple-200 bg-purple-50 hover:border-purple-300",
    value: "text-purple-700",
  },
};

type Props = {
  stats: Stat[];
};

export function StatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((s) => {
        const styles = VARIANT_STYLES[s.variant];
        return (
          <Link
            key={`${s.href}-${s.label}`}
            href={s.href}
            className={`bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-all ${styles.card}`}
          >
            <p className="text-sm text-slate-500 leading-snug">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${styles.value}`}>{s.value}</p>
          </Link>
        );
      })}
    </div>
  );
}
