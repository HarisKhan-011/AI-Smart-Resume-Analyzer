"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function CareerAssistantError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load career assistant"
      message="We could not load your career chat. Please try again."
      onRetry={reset}
    />
  )
}
