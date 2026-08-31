import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout roles={["admin"]}>{children}</ProtectedLayout>
}
