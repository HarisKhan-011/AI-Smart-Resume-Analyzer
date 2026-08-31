import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function JobMatchLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
