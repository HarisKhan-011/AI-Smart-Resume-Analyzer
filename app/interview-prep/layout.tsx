import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function InterviewPrepLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
