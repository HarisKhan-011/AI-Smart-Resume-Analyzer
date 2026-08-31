"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load dashboard"
      message="We could not load your recent resumes. Please try again."
      onRetry={reset}
    />
  )
}
