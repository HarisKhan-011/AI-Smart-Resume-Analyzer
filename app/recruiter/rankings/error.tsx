"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function RecruiterRankingsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load rankings"
      message="We could not rank candidates for this job. Please try again."
      onRetry={reset}
    />
  )
}
