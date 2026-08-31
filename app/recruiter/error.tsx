"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function RecruiterError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load recruiter tools"
      message="We could not load recruiter data. Please try again."
      onRetry={reset}
    />
  )
}
