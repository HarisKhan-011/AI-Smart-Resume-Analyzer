import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout role="candidate">{children}</DashboardLayout>
}
