import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function SettingsLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
