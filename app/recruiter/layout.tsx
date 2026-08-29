import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function RecruiterLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout role="recruiter">{children}</DashboardLayout>
}
