import { Role } from "@/app/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    organization?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      organization?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    organization?: string | null;
  }
}
