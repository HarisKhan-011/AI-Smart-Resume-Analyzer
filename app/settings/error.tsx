"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function SettingsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Unable to load settings"
      message="Something went wrong on this page. Please try again."
      onRetry={reset}
    />
  )
}
