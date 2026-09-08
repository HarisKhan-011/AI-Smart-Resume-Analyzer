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
import { config } from "@/lib/config"
import { cn } from "@/lib/utils"
import { DatePostedFilter } from "@/components/jobs/date-posted-filter"
import { KeywordSuggestInput } from "@/components/jobs/keyword-suggest-input"
import { formatEmploymentType, filterSearchJobs, resolveJobSearchLocation, resolvePostedWithin, type PostedWithin } from "@/services/jobs/normalize-job"
import type { Job } from "@/types/job"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

type SearchJobsResponse = {
  error?: string
  jobs?: Job[]
  warning?: string | null
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
  initialPostedWithin = "all",
}: {
  initialKeyword?: string
  initialLocation?: string
  initialJobType?: string
  initialPostedWithin?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [keyword, setKeyword] = useState(initialKeyword)
  const [location, setLocation] = useState(resolveJobSearchLocation(initialLocation))
  const [jobType, setJobType] = useState(initialJobType || "all")
  const [postedWithin, setPostedWithin] = useState<PostedWithin>(
    resolvePostedWithin(initialPostedWithin)
  )
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function runSearch(
    next = { keyword, location, jobType, postedWithin }
  ) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)
    setWarning(null)
    setHasSearched(true)

    const resolvedLocation = resolveJobSearchLocation(next.location)
    setLocation(resolvedLocation)

    const params = new URLSearchParams()
    if (next.keyword.trim()) params.set("keyword", next.keyword.trim())
    params.set("location", resolvedLocation)
    if (next.jobType && next.jobType !== "all") params.set("jobType", next.jobType)
    if (next.postedWithin && next.postedWithin !== "all") params.set("posted", next.postedWithin)

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
      setWarning(body.warning ?? null)
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === "AbortError") return
      setJobs([])
      setError(searchError instanceof Error ? searchError.message : "Unable to search jobs.")
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    void runSearch({
      keyword: initialKeyword,
      location: resolveJobSearchLocation(initialLocation),
      jobType: initialJobType || "all",
      postedWithin: resolvePostedWithin(initialPostedWithin),
    })
    return () => abortRef.current?.abort()
    // Search Pakistan jobs once from the URL on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runSearch()
  }

  function onPostedWithinChange(next: PostedWithin) {
    setPostedWithin(next)
    void runSearch({ keyword, location, jobType, postedWithin: next })
  }

  const visibleJobs = filterSearchJobs(jobs, { keyword, location, jobType, postedWithin })

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto]"
        onSubmit={onSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="job-keyword">Search keyword</Label>
          <KeywordSuggestInput
            id="job-keyword"
            name="keyword"
            value={keyword}
            onChange={setKeyword}
            onPick={(next) => {
              void runSearch({ keyword: next, location, jobType, postedWithin })
            }}
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
            placeholder={config.jobs.locationPlaceholder}
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

      <DatePostedFilter
        value={postedWithin}
        disabled={isLoading}
        onChange={onPostedWithinChange}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warning && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
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

      {!isLoading && hasSearched && !error && visibleJobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No matching jobs"
          description={
            postedWithin !== "all"
              ? "No jobs were posted in that time window. Reset Date posted, or try Past week or Past month."
              : keyword.trim()
                ? "This Pakistan job board has no listings for that keyword in this city. Try a broader title, or add a Jooble API key for more private-sector jobs."
                : "Try another city, such as Lahore, Karachi, or Islamabad, or a different keyword."
          }
        />
      )}

      {!isLoading && visibleJobs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleJobs.map((job) => (
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
