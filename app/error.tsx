"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <ErrorState
        title="Something went wrong"
        message="The page could not be loaded. Please try again."
        onRetry={reset}
      />
    </div>
  )
}
