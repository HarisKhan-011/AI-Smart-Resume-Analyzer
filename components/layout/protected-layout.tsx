import { requireAuth, requireRole } from "@/lib/auth-utils"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import type { UserRole } from "@/types/user"

interface ProtectedLayoutProps {
  children: React.ReactNode
  roles?: UserRole[]
}

export async function ProtectedLayout({ children, roles }: ProtectedLayoutProps) {
  if (roles) {
    await requireRole(roles)
  } else {
    await requireAuth()
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
