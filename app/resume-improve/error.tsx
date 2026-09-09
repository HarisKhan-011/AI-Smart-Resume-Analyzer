"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function ResumeImproveError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load resume improvement"
      message="We could not load resume improvement. Please try again."
      onRetry={reset}
    />
  )
}
