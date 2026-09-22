"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function IndustryInsightsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load industry insights"
      message="We could not load industry insights. Please try again."
      onRetry={reset}
    />
  )
}
