"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function CareerRoadmapError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load career roadmap"
      message="We could not load career roadmap. Please try again."
      onRetry={reset}
    />
  )
}
