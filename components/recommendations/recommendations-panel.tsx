"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Lightbulb, Loader2, RefreshCw, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { JobCard } from "@/components/jobs/job-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { JobCardSkeleton } from "@/components/dashboard/skeletons"
import { MatchScore } from "@/components/matching/match-score"
import { cn } from "@/lib/utils"
import type { JobRecommendation } from "@/types/recommendation"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export type RecommendationResumeOption = {
  id: string
  fileName: string
  skillCount: number
  analysisStatus: string
}

type RecommendationsResponse = {
  error?: string
  resume?: { id: string; fileName: string }
  recommendations?: JobRecommendation[]
}

export function RecommendationsPanel({
  resumes,
  initialResumeId,
}: {
  resumes: RecommendationResumeOption[]
  initialResumeId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const analyzed = resumes.filter((resume) => resume.skillCount > 0)
  const [resumeId, setResumeId] = useState(
    analyzed.some((resume) => resume.id === initialResumeId)
      ? initialResumeId ?? ""
      : analyzed[0]?.id ?? resumes[0]?.id ?? ""
  )
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function loadRecommendations(nextResumeId = resumeId) {
    if (!nextResumeId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)
    router.replace(`${pathname}?resumeId=${encodeURIComponent(nextResumeId)}`, { scroll: false })

    try {
      const response = await fetch(
        `/api/recommendations?resumeId=${encodeURIComponent(nextResumeId)}`,
        { signal: controller.signal, cache: "no-store" }
      )
      const body = (await response.json()) as RecommendationsResponse
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to load recommendations.")
      }
      setRecommendations(body.recommendations ?? [])
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return
      setRecommendations([])
      setError(loadError instanceof Error ? loadError.message : "Unable to load recommendations.")
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    if (resumeId) void loadRecommendations(resumeId)
    return () => abortRef.current?.abort()
    // Load once for the selected resume on mount / resume change is handled explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (resumes.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="Upload a resume first"
        description="Recommendations need an analyzed resume so we can compare your skills with available jobs."
        actionText="Upload Resume"
        actionHref="/resume/upload"
      />
    )
  }

  if (analyzed.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Analyze a resume first"
        description="Extract skills from a resume, then we can rank suitable jobs for you."
        actionText="View resumes"
        actionHref="/resume"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        {analyzed.length > 1 && (
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="recommendation-resume">Resume</Label>
            <select
              id="recommendation-resume"
              className={cn(selectClassName)}
              value={resumeId}
              disabled={isLoading}
              onChange={(event) => {
                const nextId = event.target.value
                setResumeId(nextId)
                void loadRecommendations(nextId)
              }}
            >
              {analyzed.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.fileName} ({resume.skillCount} skills)
                </option>
              ))}
            </select>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || !resumeId}
          onClick={() => void loadRecommendations()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          {isLoading ? "Refreshing..." : "Refresh recommendations"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load recommendations</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadRecommendations()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      )}

      {!isLoading && !error && recommendations.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="No suitable jobs yet"
          description="We only recommend jobs where your resume has enough overlapping skills. Search and save more listings, or analyze another job description."
          actionText="Search Jobs"
          actionHref="/jobs"
        />
      )}

      {!isLoading && recommendations.length > 0 && (
        <ol className="space-y-4">
          {recommendations.map((item) => (
            <li key={item.jobId} className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
              <MatchScore score={item.overallScore} size="sm" />
              <JobCard
                id={item.job.id}
                title={item.job.title}
                company={item.job.company}
                location={item.job.location}
                employmentType={item.job.employmentType}
                source={item.job.source}
                sourceUrl={item.job.sourceUrl}
                matchScore={item.overallScore}
                skills={item.matchedSkills}
                missingSkills={item.missingSkills}
                href={`/jobs/${item.job.id}`}
                checkMatchHref={`/job-match?jobId=${item.job.id}`}
              />
            </li>
          ))}
        </ol>
      )}

      {!isLoading && recommendations.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing top {recommendations.length} suitable job
          {recommendations.length === 1 ? "" : "s"}.{" "}
          <Link href="/jobs" className="font-medium text-primary underline-offset-4 hover:underline">
            Search more jobs
          </Link>
        </p>
      )}
    </div>
  )
}
