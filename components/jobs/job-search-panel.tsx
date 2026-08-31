"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, Briefcase, Loader2, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JobCard } from "@/components/jobs/job-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { JobCardSkeleton } from "@/components/dashboard/skeletons"
import { EMPLOYMENT_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { formatEmploymentType } from "@/services/jobs/normalize-job"
import type { Job } from "@/types/job"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

type SearchJobsResponse = {
  error?: string
  jobs?: Job[]
}

const JOB_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...Object.values(EMPLOYMENT_TYPES).map((value) => ({
    value,
    label: formatEmploymentType(value),
  })),
]

export function JobSearchPanel({
  initialKeyword = "",
  initialLocation = "",
  initialJobType = "all",
}: {
  initialKeyword?: string
  initialLocation?: string
  initialJobType?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [keyword, setKeyword] = useState(initialKeyword)
  const [location, setLocation] = useState(initialLocation)
  const [jobType, setJobType] = useState(initialJobType || "all")
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function runSearch(next = { keyword, location, jobType }) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    const params = new URLSearchParams()
    if (next.keyword.trim()) params.set("keyword", next.keyword.trim())
    if (next.location.trim()) params.set("location", next.location.trim())
    if (next.jobType && next.jobType !== "all") params.set("jobType", next.jobType)

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })

    try {
      const response = await fetch(`/api/jobs/search?${query}`, {
        signal: controller.signal,
        cache: "no-store",
      })
      const body = (await response.json()) as SearchJobsResponse
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to search jobs.")
      }
      setJobs(body.jobs ?? [])
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === "AbortError") return
      setJobs([])
      setError(searchError instanceof Error ? searchError.message : "Unable to search jobs.")
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    const shouldSearch =
      Boolean(initialKeyword.trim()) ||
      Boolean(initialLocation.trim()) ||
      Boolean(initialJobType && initialJobType !== "all")
    if (shouldSearch) {
      void runSearch({
        keyword: initialKeyword,
        location: initialLocation,
        jobType: initialJobType || "all",
      })
    }
    return () => abortRef.current?.abort()
    // Search once from the URL on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runSearch()
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto]"
        onSubmit={onSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="job-keyword">Search keyword</Label>
          <Input
            id="job-keyword"
            name="keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="React, Python, product manager"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-location">Location</Label>
          <Input
            id="job-location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Remote, London, New York"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-type">Job type</Label>
          <select
            id="job-type"
            name="jobType"
            className={cn(selectClassName)}
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
            disabled={isLoading}
          >
            {JOB_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      )}

      {!isLoading && !hasSearched && !error && (
        <EmptyState
          icon={Briefcase}
          title="Search online jobs"
          description="Enter a keyword or location, then search to fetch live listings and save them for matching."
        />
      )}

      {!isLoading && hasSearched && !error && jobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try a different keyword, location, or job type. Remote-friendly roles work best with the default job source."
        />
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              id={job.id}
              title={job.title}
              company={job.company}
              location={job.location}
              employmentType={job.employmentType}
              source={job.source}
              sourceUrl={job.sourceUrl}
              skills={job.requiredSkills}
              postedAt={job.postedDate}
              href={`/jobs/${job.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
