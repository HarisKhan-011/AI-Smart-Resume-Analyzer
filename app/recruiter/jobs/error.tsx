"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function RecruiterJobsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load jobs"
      message="We could not load your job postings. Please try again."
      onRetry={reset}
    />
  )
}
