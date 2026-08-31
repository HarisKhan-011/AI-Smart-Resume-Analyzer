"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function RecommendationsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load recommendations"
      message="We could not load job recommendations. Please try again."
      onRetry={reset}
    />
  )
}
