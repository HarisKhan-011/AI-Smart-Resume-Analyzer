import {
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import { firstNonEmpty, mapEmploymentType, matchesJobLocation, stripHtml } from "@/services/jobs/normalize-job"

type RemotiveJob = {
  title?: unknown
  company_name?: unknown
  candidate_required_location?: unknown
  description?: unknown
  job_type?: unknown
  url?: unknown
  publication_date?: unknown
  tags?: unknown
}

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs"

export class RemotiveJobProvider implements JobProvider {
  readonly id = "remotive"

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    const params = new URLSearchParams()
    if (query.keyword?.trim()) params.set("search", query.keyword.trim())
    params.set("limit", "20")

    let response: Response
    try {
      response = await fetch(`${REMOTIVE_URL}?${params.toString()}`, {
        headers: { Accept: "application/json", "User-Agent": "ResumeAI/0.1" },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      })
    } catch {
      throw new JobProviderError(
        "The job listings service is unavailable. Please try again later.",
        503,
        "PROVIDER_UNAVAILABLE"
      )
    }

    if (response.status === 429) {
      throw new JobProviderError(
        "The job listings service is rate-limited. Please wait and try again.",
        429,
        "RATE_LIMITED"
      )
    }

    if (!response.ok) {
      throw new JobProviderError(
        "The job listings service returned an error.",
        502,
        "PROVIDER_HTTP_ERROR"
      )
    }

    const payload = (await response.json().catch(() => null)) as { jobs?: unknown } | null
    if (!payload || !Array.isArray(payload.jobs)) {
      throw new JobProviderError("The job listings service returned an invalid response.", 502, "INVALID_RESPONSE")
    }

    const locationFilter = query.location?.trim()
    const jobTypeFilter = query.jobType?.trim()

    return payload.jobs
      .map((item) => this.toProviderJob(item as RemotiveJob))
      .filter((job): job is ProviderJob => Boolean(job))
      .filter((job) => matchesJobLocation(job.location, locationFilter))
      .filter((job) => {
        if (!jobTypeFilter || jobTypeFilter === "all") return true
        return job.employmentType === jobTypeFilter
      })
      .slice(0, 20)
  }

  private toProviderJob(item: RemotiveJob): ProviderJob | null {
    const title = firstNonEmpty(typeof item.title === "string" ? item.title : "")
    const company = firstNonEmpty(typeof item.company_name === "string" ? item.company_name : "")
    const sourceUrl = firstNonEmpty(typeof item.url === "string" ? item.url : "")
    if (!title || !company || !sourceUrl) return null

    const description = stripHtml(typeof item.description === "string" ? item.description : "")
    if (description.length < 20) return null

    const tags = Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : []

    const postedDate =
      typeof item.publication_date === "string" && !Number.isNaN(Date.parse(item.publication_date))
        ? new Date(item.publication_date)
        : new Date()

    return {
      title,
      company,
      location: firstNonEmpty(
        typeof item.candidate_required_location === "string" ? item.candidate_required_location : "",
        "Remote"
      ),
      description: description.slice(0, 20000),
      employmentType: mapEmploymentType(typeof item.job_type === "string" ? item.job_type : ""),
      requiredSkills: tags,
      preferredSkills: [],
      source: "api",
      sourceUrl,
      postedDate,
    }
  }
}
