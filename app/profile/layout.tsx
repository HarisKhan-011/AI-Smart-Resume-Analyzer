import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function ProfileLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
