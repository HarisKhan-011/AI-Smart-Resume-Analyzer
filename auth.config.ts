import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/types/user"
import { applyAuthEnv } from "@/lib/auth-env"

applyAuthEnv()

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ""
        session.user.role = (token.role as UserRole) ?? "candidate"
      }
      return session
    },
  },
} satisfies NextAuthConfig
