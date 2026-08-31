import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function RecruiterLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout roles={["recruiter", "admin"]}>{children}</ProtectedLayout>
}
