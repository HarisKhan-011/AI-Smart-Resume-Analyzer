"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function JobsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load jobs"
      message="We could not load job listings. Please try again."
      onRetry={reset}
    />
  )
}
