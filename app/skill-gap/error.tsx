"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function SkillGapError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load skill gap"
      message="We could not load skill gap analysis. Please try again."
      onRetry={reset}
    />
  )
}
