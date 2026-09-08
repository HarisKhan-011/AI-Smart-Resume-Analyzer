import {
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import {
  firstNonEmpty,
  mapEmploymentType,
  matchesJobLocation,
  matchesPostedWithin,
  stripHtml,
} from "@/services/jobs/normalize-job"

type AdzunaJob = {
  title?: unknown
  description?: unknown
  created?: unknown
  redirect_url?: unknown
  contract_time?: unknown
  contract_type?: unknown
  company?: { display_name?: unknown }
  location?: { display_name?: unknown }
}

export class AdzunaJobProvider implements JobProvider {
  readonly id = "adzuna"

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    const appId = process.env.ADZUNA_APP_ID?.trim()
    const appKey = process.env.ADZUNA_APP_KEY?.trim()
    const country = (process.env.ADZUNA_COUNTRY ?? "pk").trim().toLowerCase()

    if (!appId || !appKey) {
      throw new JobProviderError(
        "Adzuna is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to .env.local.",
        503,
        "PROVIDER_NOT_CONFIGURED"
      )
    }

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "20",
      what: query.keyword?.trim() || "developer",
      content_type: "application/json",
    })
    if (query.location?.trim()) params.set("where", query.location.trim())

    const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1?${params.toString()}`

    let response: Response
    try {
      response = await fetch(url, {
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
      throw new JobProviderError("The job listings service returned an error.", 502, "PROVIDER_HTTP_ERROR")
    }

    const payload = (await response.json().catch(() => null)) as { results?: unknown } | null
    if (!payload || !Array.isArray(payload.results)) {
      throw new JobProviderError("The job listings service returned an invalid response.", 502, "INVALID_RESPONSE")
    }

    const jobTypeFilter = query.jobType?.trim()

    return payload.results
      .map((item) => this.toProviderJob(item as AdzunaJob))
      .filter((job): job is ProviderJob => Boolean(job))
      .filter((job) => matchesJobLocation(job.location, query.location))
      .filter((job) => {
        if (!jobTypeFilter || jobTypeFilter === "all") return true
        return job.employmentType === jobTypeFilter
      })
      .filter((job) => matchesPostedWithin(job.postedDate, query.postedWithin))
  }

  private toProviderJob(item: AdzunaJob): ProviderJob | null {
    const title = firstNonEmpty(typeof item.title === "string" ? item.title : "")
    const company = firstNonEmpty(
      typeof item.company?.display_name === "string" ? item.company.display_name : ""
    )
    const sourceUrl = firstNonEmpty(typeof item.redirect_url === "string" ? item.redirect_url : "")
    if (!title || !company || !sourceUrl) return null

    const description = stripHtml(typeof item.description === "string" ? item.description : "")
    if (description.length < 20) return null

    const postedDate =
      typeof item.created === "string" && !Number.isNaN(Date.parse(item.created))
        ? new Date(item.created)
        : new Date()

    return {
      title,
      company,
      location: firstNonEmpty(
        typeof item.location?.display_name === "string" ? item.location.display_name : "",
        "Not specified"
      ),
      description: description.slice(0, 20000),
      employmentType: mapEmploymentType(
        typeof item.contract_time === "string"
          ? item.contract_time
          : typeof item.contract_type === "string"
            ? item.contract_type
            : ""
      ),
      requiredSkills: [],
      preferredSkills: [],
      source: "api",
      sourceUrl,
      postedDate,
    }
  }
}
