"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, ClipboardList, Loader2, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge"
import {
  removeTrackedApplication,
  syncTrackedApplication,
} from "@/components/applications/job-application-actions"
import { cn, formatDate } from "@/lib/utils"
import {
  APPLICATION_STATUS_ORDER,
  applicationStatusLabel,
} from "@/services/applications/status"
import type { ApplicationWithJob } from "@/services/applications/application-service"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

type BoardItem = ApplicationWithJob

export function ApplicationsBoard({
  initialItems,
  initialStatus = "all",
}: {
  initialItems: BoardItem[]
  initialStatus?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState(initialStatus || "all")
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<BoardItem | null>(null)

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [filter, items]
  )

  function setFilterAndUrl(next: string) {
    setFilter(next)
    const params = new URLSearchParams()
    if (next !== "all") params.set("status", next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  async function patchApplication(id: string, body: { status?: string; notes?: string }) {
    setPendingId(id)
    setError(null)
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = (await response.json()) as { error?: string; application?: BoardItem }
      if (!response.ok || !payload.application) {
        throw new Error(payload.error ?? "Unable to update application.")
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...payload.application,
                job: item.job,
                matchScore: item.matchScore,
              }
            : item
        )
      )
      syncTrackedApplication({
        id: payload.application.id,
        jobId: payload.application.jobId,
        status: payload.application.status,
      })
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update application.")
    } finally {
      setPendingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setPendingId(id)
    setError(null)
    try {
      const response = await fetch(`/api/applications/${id}`, { method: "DELETE" })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete application.")
      }
      setItems((current) => current.filter((item) => item.id !== id))
      removeTrackedApplication(deleteTarget.jobId)
      setDeleteTarget(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete application.")
    } finally {
      setPendingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No applications tracked"
        description="Save a job or mark it as applied from a job listing to start tracking."
        actionText="Search Jobs"
        actionHref="/jobs"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilterAndUrl("all")}
        >
          All ({items.length})
        </Button>
        {APPLICATION_STATUS_ORDER.map((status) => {
          const count = items.filter((item) => item.status === status).length
          return (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilterAndUrl(status)}
            >
              {applicationStatusLabel(status)} ({count})
            </Button>
          )
        })}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications in this status"
          description="Try another status filter, or track a new job from Search Jobs."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Match</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="border-b align-top last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.job?.title ?? "Job unavailable"}</p>
                      <p className="text-muted-foreground">
                        {item.job?.company ?? "Unknown company"}
                        {item.job?.location ? ` · ${item.job.location}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.matchScore != null ? `${item.matchScore}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={cn(selectClassName, "h-9")}
                        value={item.status}
                        disabled={pendingId === item.id}
                        onChange={(event) =>
                          void patchApplication(item.id, { status: event.target.value })
                        }
                        aria-label={`Status for ${item.job?.title ?? "application"}`}
                      >
                        {APPLICATION_STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>
                            {applicationStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {item.appliedAt ? formatDate(item.appliedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <NotesEditor
                        item={item}
                        draft={notesDraft[item.id] ?? item.notes ?? ""}
                        disabled={pendingId === item.id}
                        onDraftChange={(value) =>
                          setNotesDraft((current) => ({ ...current, [item.id]: value }))
                        }
                        onSave={(notes) => void patchApplication(item.id, { notes })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {item.job && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/jobs/${item.job.id}`}>View Job</Link>
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={pendingId === item.id}
                          onClick={() => setDeleteTarget(item)}
                        >
                          {pendingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {visible.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="font-semibold">{item.job?.title ?? "Job unavailable"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.job?.company ?? "Unknown company"}
                      {item.job?.location ? ` · ${item.job.location}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ApplicationStatusBadge status={item.status} />
                    <span className="text-sm text-muted-foreground">
                      Match {item.matchScore != null ? `${item.matchScore}%` : "—"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Applied {item.appliedAt ? formatDate(item.appliedAt) : "—"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`status-${item.id}`}>Status</Label>
                    <select
                      id={`status-${item.id}`}
                      className={selectClassName}
                      value={item.status}
                      disabled={pendingId === item.id}
                      onChange={(event) =>
                        void patchApplication(item.id, { status: event.target.value })
                      }
                    >
                      {APPLICATION_STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {applicationStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <NotesEditor
                    item={item}
                    draft={notesDraft[item.id] ?? item.notes ?? ""}
                    disabled={pendingId === item.id}
                    onDraftChange={(value) =>
                      setNotesDraft((current) => ({ ...current, [item.id]: value }))
                    }
                    onSave={(notes) => void patchApplication(item.id, { notes })}
                  />
                  <div className="flex gap-2">
                    {item.job && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/jobs/${item.job.id}`}>View Job</Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pendingId === item.id}
                      onClick={() => setDeleteTarget(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete application?</DialogTitle>
            <DialogDescription>
              This removes tracking for{" "}
              {deleteTarget?.job?.title ?? "this job"}. You can save or apply again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pendingId === deleteTarget?.id}
              onClick={() => void confirmDelete()}
            >
              {pendingId === deleteTarget?.id ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NotesEditor({
  item,
  draft,
  disabled,
  onDraftChange,
  onSave,
}: {
  item: BoardItem
  draft: string
  disabled: boolean
  onDraftChange: (value: string) => void
  onSave: (notes: string) => void
}) {
  const unchanged = draft === (item.notes ?? "")
  return (
    <div className="space-y-2">
      <Label htmlFor={`notes-${item.id}`} className="sr-only md:not-sr-only">
        Notes
      </Label>
      <Textarea
        id={`notes-${item.id}`}
        value={draft}
        disabled={disabled}
        rows={3}
        placeholder="Add notes"
        onChange={(event) => onDraftChange(event.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || unchanged}
        onClick={() => onSave(draft)}
      >
        Save notes
      </Button>
    </div>
  )
}
