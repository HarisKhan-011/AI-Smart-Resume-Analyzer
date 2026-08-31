"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function RecruiterCandidatesError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load candidates"
      message="We could not load applicants for your jobs. Please try again."
      onRetry={reset}
    />
  )
}
