"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function JobMatchError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to analyze job"
      message="Something went wrong on this page. Please try again."
      onRetry={reset}
    />
  )
}
