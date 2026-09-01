"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load admin dashboard"
      message="We could not load administrative data. Please try again."
      onRetry={reset}
    />
  )
}
