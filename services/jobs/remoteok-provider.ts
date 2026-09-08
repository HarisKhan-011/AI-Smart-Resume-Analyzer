import {
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import {
  firstNonEmpty,
  mapEmploymentType,
  matchesJobKeyword,
  matchesJobLocation,
  stripHtml,
} from "@/services/jobs/normalize-job"

type RemoteOkJob = {
  position?: unknown
  company?: unknown
  location?: unknown
  description?: unknown
  url?: unknown
  apply_url?: unknown
  tags?: unknown
  epoch?: unknown
  date?: unknown
}

const REMOTE_OK_URL = "https://remoteok.com/api"

export class RemoteOkJobProvider implements JobProvider {
  readonly id = "remoteok"

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    let response: Response
    try {
      response = await fetch(REMOTE_OK_URL, {
        headers: {
          Accept: "application/json",
          "User-Agent": "ResumeAI/0.1 (job search; localhost)",
        },
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

    const payload = (await response.json().catch(() => null)) as unknown
    if (!Array.isArray(payload)) {
      throw new JobProviderError("The job listings service returned an invalid response.", 502, "INVALID_RESPONSE")
    }

    const jobTypeFilter = query.jobType?.trim()

    return payload
      .map((item) => this.toProviderJob(item as RemoteOkJob))
      .filter((job): job is ProviderJob => Boolean(job))
      .filter((job) => matchesJobKeyword(job, query.keyword))
      .filter((job) => matchesJobLocation(job.location, query.location))
      .filter((job) => {
        if (!jobTypeFilter || jobTypeFilter === "all") return true
        return job.employmentType === jobTypeFilter
      })
      .slice(0, 20)
  }

  private toProviderJob(item: RemoteOkJob): ProviderJob | null {
    const title = firstNonEmpty(typeof item.position === "string" ? item.position : "")
    const company = firstNonEmpty(typeof item.company === "string" ? item.company : "")
    const sourceUrl = firstNonEmpty(
      typeof item.url === "string" ? item.url : "",
      typeof item.apply_url === "string" ? item.apply_url : ""
    )
    if (!title || !company || !sourceUrl) return null

    const description = stripHtml(typeof item.description === "string" ? item.description : "")
    if (description.length < 20) return null

    const tags = Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : []

    const postedDate =
      typeof item.epoch === "number"
        ? new Date(item.epoch * 1000)
        : typeof item.date === "string" && !Number.isNaN(Date.parse(item.date))
          ? new Date(item.date)
          : new Date()

    return {
      title,
      company,
      location: firstNonEmpty(typeof item.location === "string" ? item.location : "", "Remote"),
      description: description.slice(0, 20000),
      employmentType: "full-time",
      requiredSkills: tags,
      preferredSkills: [],
      source: "api",
      sourceUrl,
      postedDate,
    }
  }
}
