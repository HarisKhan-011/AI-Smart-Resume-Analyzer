"use client"

import { useCallback, useEffect, useState } from "react"
import { Bookmark, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApplicationStatus } from "@/types/application"

type TrackedApplication = {
  id: string
  jobId: string
  status: ApplicationStatus
}

type ApplicationsResponse = {
  error?: string
  application?: TrackedApplication | null
  applications?: TrackedApplication[]
}

let trackedCache: TrackedApplication[] | null = null
let trackedInflight: Promise<TrackedApplication[]> | null = null
const trackedListeners = new Set<(items: TrackedApplication[]) => void>()

function notifyTracked(items: TrackedApplication[]) {
  trackedCache = items
  for (const listener of trackedListeners) listener(items)
}

async function loadTrackedApplications(): Promise<TrackedApplication[]> {
  if (trackedCache) return trackedCache
  if (!trackedInflight) {
    trackedInflight = fetch("/api/applications", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as ApplicationsResponse
        if (!response.ok) throw new Error(body.error ?? "Unable to load applications.")
        return body.applications ?? []
      })
      .then((items) => {
        trackedCache = items
        return items
      })
      .finally(() => {
        trackedInflight = null
      })
  }
  return trackedInflight
}

function upsertTracked(application: TrackedApplication) {
  const current = trackedCache ?? []
  notifyTracked([
    application,
    ...current.filter((item) => item.jobId !== application.jobId && item.id !== application.id),
  ])
}

export function syncTrackedApplication(application: TrackedApplication) {
  upsertTracked(application)
}

export function removeTrackedApplication(jobId: string) {
  notifyTracked((trackedCache ?? []).filter((item) => item.jobId !== jobId))
}

export function JobApplicationActions({
  jobId,
  applyUrl = null,
  compact = false,
}: {
  jobId: string
  applyUrl?: string | null
  compact?: boolean
}) {
  const [status, setStatus] = useState<ApplicationStatus | null>(null)
  const [pending, setPending] = useState<"saved" | "applied" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const listener = (items: TrackedApplication[]) => {
      const match = items.find((item) => item.jobId === jobId)
      if (active) setStatus(match?.status ?? null)
    }
    trackedListeners.add(listener)
    void loadTrackedApplications()
      .then(listener)
      .catch(() => {
        if (active) setStatus(null)
      })
    return () => {
      active = false
      trackedListeners.delete(listener)
    }
  }, [jobId])

  const track = useCallback(
    async (nextStatus: "saved" | "applied") => {
      setPending(nextStatus)
      setError(null)
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, status: nextStatus }),
        })
        const body = (await response.json()) as ApplicationsResponse & {
          application?: TrackedApplication
        }
        if (!response.ok || !body.application) {
          throw new Error(body.error ?? "Unable to track this job.")
        }
        upsertTracked(body.application)
        setStatus(body.application.status)
      } catch (trackError) {
        setError(trackError instanceof Error ? trackError.message : "Unable to track this job.")
      } finally {
        setPending(null)
      }
    },
    [jobId]
  )

  const apply = useCallback(async () => {
    if (applyUrl) {
      window.open(applyUrl, "_blank", "noopener,noreferrer")
    }
    await track("applied")
  }, [applyUrl, track])

  const isSaved = Boolean(status)
  const isApplied = status != null && status !== "saved"

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "flex flex-1 flex-wrap gap-2"}>
      <Button
        type="button"
        variant={isSaved ? "secondary" : "outline"}
        size="sm"
        className={compact ? undefined : "flex-1"}
        disabled={Boolean(pending) || isSaved}
        onClick={() => void track("saved")}
      >
        {pending === "saved" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        {isSaved ? "Saved" : "Save Job"}
      </Button>
      <Button
        type="button"
        size="sm"
        className={compact ? undefined : "flex-1"}
        disabled={Boolean(pending) || isApplied}
        onClick={() => void apply()}
      >
        {pending === "applied" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {isApplied ? "Applied" : applyUrl ? "Apply" : "Track Application"}
      </Button>
      {error && <p className="basis-full text-xs text-destructive">{error}</p>}
    </div>
  )
}
