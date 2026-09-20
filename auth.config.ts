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
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.picture = user.image
      }
      if (trigger === "update" && session && typeof session === "object") {
        const next = session as { name?: string; image?: string | null }
        if (typeof next.name === "string") token.name = next.name
        if ("image" in next) token.picture = next.image
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ""
        session.user.role = (token.role as UserRole) ?? "candidate"
        if (typeof token.name === "string") session.user.name = token.name
        if (token.picture !== undefined) session.user.image = (token.picture as string | null) ?? null
      }
      return session
    },
  },
} satisfies NextAuthConfig
