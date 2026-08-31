import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function SkillGapLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
