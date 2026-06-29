import { Role } from "@/app/generated/prisma/client";

export type Permission =
  | "events:create:public"
  | "events:create:private"
  | "events:delete:any"
  | "tasks:assign"
  | "tasks:edit:own"
  | "resources:manage"
  | "agenda:manage"
  | "agenda:maire:view"
  | "agenda:maire:write"
  | "users:manage"
  | "admin:access";

const PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "events:create:public",
    "events:create:private",
    "events:delete:any",
    "tasks:assign",
    "tasks:edit:own",
    "resources:manage",
    "agenda:manage",
    "agenda:maire:view",
    "agenda:maire:write",
    "users:manage",
    "admin:access",
  ],
  MAIRE: [
    "events:create:public",
    "events:create:private",
    "events:delete:any",
    "tasks:assign",
    "tasks:edit:own",
    "resources:manage",
    "agenda:manage",
    "agenda:maire:view",
    "agenda:maire:write",
    "users:manage",
    "admin:access",
  ],
  ADJOINTE: [
    "events:create:public",
    "events:create:private",
    "tasks:assign",
    "tasks:edit:own",
    "resources:manage",
    "agenda:manage",
    "agenda:maire:view",
    "agenda:maire:write",
  ],
  EMPLOYEE: ["events:create:private", "tasks:edit:own", "agenda:manage"],
  CONTRACTANT: ["tasks:edit:own", "agenda:manage"],
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  MAIRE: "Maire",
  ADJOINTE: "Adjointe",
  EMPLOYEE: "Employé",
  CONTRACTANT: "Contractant",
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-800",
  MAIRE: "bg-purple-100 text-purple-800",
  ADJOINTE: "bg-blue-100 text-blue-800",
  EMPLOYEE: "bg-green-100 text-green-800",
  CONTRACTANT: "bg-gray-100 text-gray-800",
};
