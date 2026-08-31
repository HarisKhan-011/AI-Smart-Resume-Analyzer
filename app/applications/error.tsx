"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function ApplicationsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load applications"
      message="We could not load your tracked applications. Please try again."
      onRetry={reset}
    />
  )
}
