import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function CareerRoadmapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
