"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load profile"
      message="We could not load your account details. Please try again."
      onRetry={reset}
    />
  )
}
