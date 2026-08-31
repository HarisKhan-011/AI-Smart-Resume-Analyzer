"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function ResumeError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load resumes"
      message="We could not load your resumes. Please try again."
      onRetry={reset}
    />
  )
}
