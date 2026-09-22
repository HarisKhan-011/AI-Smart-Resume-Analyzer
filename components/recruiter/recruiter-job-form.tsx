"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EMPLOYMENT_TYPES } from "@/lib/constants"
import { formatEmploymentType } from "@/services/jobs/normalize-job"
import { cn } from "@/lib/utils"
import type { Job } from "@/types/job"

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export function RecruiterJobForm({ job }: { job?: Job }) {
  const router = useRouter()
  const [title, setTitle] = useState(job?.title ?? "")
  const [company, setCompany] = useState(job?.company ?? "")
  const [location, setLocation] = useState(job?.location ?? "Pakistan")
  const [employmentType, setEmploymentType] = useState(job?.employmentType ?? "full-time")
  const [description, setDescription] = useState(job?.description ?? "")
  const [requiredSkills, setRequiredSkills] = useState((job?.requiredSkills ?? []).join(", "))
  const [preferredSkills, setPreferredSkills] = useState((job?.preferredSkills ?? []).join(", "))
  const [isActive, setIsActive] = useState(job?.isActive !== false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        title,
        company,
        location,
        employmentType,
        description,
        requiredSkills,
        preferredSkills,
        isActive,
      }
      const response = await fetch(job ? `/api/recruiter/jobs/${job.id}` : "/api/recruiter/jobs", {
        method: job ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as { error?: string; job?: Job }
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save job.")
      }
      router.push("/recruiter/jobs")
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save job.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{job ? "Edit job" : "Create job"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Save failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recruiter-job-title">Job title</Label>
              <Input
                id="recruiter-job-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={2}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-job-company">Company</Label>
              <Input
                id="recruiter-job-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                required
                minLength={2}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-job-location">Location</Label>
              <Input
                id="recruiter-job-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                minLength={2}
                placeholder="Lahore, Karachi, Islamabad"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-job-type">Employment type</Label>
              <select
                id="recruiter-job-type"
                className={cn(selectClassName)}
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value as Job["employmentType"])}
                disabled={isSaving}
              >
                {Object.values(EMPLOYMENT_TYPES).map((value) => (
                  <option key={value} value={value}>
                    {formatEmploymentType(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recruiter-job-description">Description</Label>
            <Textarea
              id="recruiter-job-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={8}
              required
              minLength={50}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recruiter-job-required">Required skills</Label>
            <Input
              id="recruiter-job-required"
              value={requiredSkills}
              onChange={(event) => setRequiredSkills(event.target.value)}
              placeholder="JavaScript, React, Node.js"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Aliases from the skill dictionary are normalized (JS → JavaScript).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recruiter-job-preferred">Preferred skills</Label>
            <Input
              id="recruiter-job-preferred"
              value={preferredSkills}
              onChange={(event) => setPreferredSkills(event.target.value)}
              placeholder="AWS, Docker"
              disabled={isSaving}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={isSaving}
            />
            Active listing (visible to candidates)
          </label>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : job ? "Save changes" : "Create job"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
