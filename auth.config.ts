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
        token.role = (user as any).role;
        token.organization = (user as any).organization;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).organization = token.organization;
      }
      return session;
    },
  },
};
