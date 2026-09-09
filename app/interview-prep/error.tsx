"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function InterviewPrepError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load interview prep"
      message="We could not load interview preparation. Please try again."
      onRetry={reset}
    />
  )
}
