import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function ResumeLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
