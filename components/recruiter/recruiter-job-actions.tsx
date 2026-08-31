"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatEmploymentType } from "@/services/jobs/normalize-job"
import type { Job } from "@/types/job"

export function RecruiterJobActions({ job }: { job: Job }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function patch(payload: Record<string, unknown>) {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? "Unable to update job.")
      router.refresh()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update job.")
    } finally {
      setPending(false)
    }
  }

  async function onDelete() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, { method: "DELETE" })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? "Unable to delete job.")
      setConfirmDelete(false)
      router.refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete job.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Badge variant={job.isActive !== false ? "success" : "secondary"}>
          {job.isActive !== false ? "Active" : "Inactive"}
        </Badge>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => void patch({ isActive: job.isActive === false })}
        >
          {job.isActive === false ? "Activate" : "Deactivate"}
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/recruiter/jobs/${job.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">{formatEmploymentType(job.employmentType)}</p>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this job?</DialogTitle>
            <DialogDescription>
              {job.title} will be removed from your listings. Existing applications stay in the database
              but the posting will no longer be visible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={() => void onDelete()}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
