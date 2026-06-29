"use client";

import { signOut } from "next-auth/react";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded hover:bg-slate-100"
      >
        Déconnexion
      </button>
    </header>
  );
}
