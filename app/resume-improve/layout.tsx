import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function ResumeImproveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
