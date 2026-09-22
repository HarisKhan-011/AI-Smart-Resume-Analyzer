import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function IndustryInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
