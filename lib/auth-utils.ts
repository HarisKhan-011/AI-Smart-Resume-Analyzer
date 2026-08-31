import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types/user"
import { getPostLoginPath } from "@/lib/auth-paths"

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: UserRole
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session.user
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireRole(
  roles: UserRole | UserRole[]
): Promise<SessionUser> {
  const user = await requireAuth()
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(user.role)) {
    redirect("/unauthorized")
  }
  return user
}

export { getPostLoginPath }
