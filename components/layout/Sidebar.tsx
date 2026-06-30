"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

interface SidebarProps {
  user: {
    name?: string | null;
    email: string;
    role: Role;
    organization?: string | null;
  };
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: "⊞", exact: true },
  { href: "/dashboard/calendar", label: "Calendrier global", icon: "📅" },
  { href: "/dashboard/agenda", label: "Mon agenda", icon: "📋" },
  { href: "/dashboard/events", label: "Événements", icon: "🎪" },
  { href: "/dashboard/tasks", label: "Tâches", icon: "✓" },
  { href: "/dashboard/resources", label: "Ressources", icon: "📦" },
  { href: "/dashboard/contracts", label: "Contrats", icon: "📄" },
];

const MAIRE_ITEMS = [
  { href: "/dashboard/agenda/maire", label: "Agenda de la Maire", icon: "👤" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/admin/users", label: "Utilisateurs", icon: "👥" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-64 h-screen flex flex-col shrink-0 overflow-y-auto" style={{ background: "#1e293b", color: "#cbd5e1" }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-white font-bold text-lg tracking-tight">Highlands</h1>
        <p className="text-slate-400 text-xs mt-0.5">Gestion d&apos;événements</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {can(user.role, "agenda:maire:view") && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mairie</p>
            </div>
            {MAIRE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}

        {can(user.role, "admin:access") && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administration</p>
            </div>
            {ADMIN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name ?? user.email}</p>
            <p className="text-slate-400 text-xs truncate">{ROLE_LABELS[user.role]}</p>
            {user.organization && (
              <p className="text-slate-500 text-xs truncate">{user.organization}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
