import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function ApplicationsLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
