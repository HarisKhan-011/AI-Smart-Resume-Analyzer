import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function JobsLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
