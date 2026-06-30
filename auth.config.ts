import type { NextAuthConfig } from "next-auth";

// Config allégée — compatible Edge Runtime (pas de Prisma, pas de Node APIs)
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isApi =
        nextUrl.pathname.startsWith("/api") &&
        !nextUrl.pathname.startsWith("/api/auth");

      if (isDashboard || isApi) {
        if (!isLoggedIn) {
          if (isDashboard)
            return Response.redirect(new URL("/login", nextUrl));
          return false;
        }
        return true;
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organization = user.organization;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@/app/generated/prisma/client").Role;
        session.user.organization = token.organization as string | null | undefined;
      }
      return session;
    },
  },
};
