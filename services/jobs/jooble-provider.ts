import { config } from "@/lib/config"
import {
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import {
  filterSearchJobs,
  firstNonEmpty,
  mapEmploymentType,
  resolveJobSearchLocation,
  stripHtml,
} from "@/services/jobs/normalize-job"

type JoobleJob = {
  title?: unknown
  location?: unknown
  snippet?: unknown
  salary?: unknown
  type?: unknown
  link?: unknown
  company?: unknown
  updated?: unknown
}

export class JoobleJobProvider implements JobProvider {
  readonly id = "jooble"

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    const apiKey = process.env.JOOBLE_API_KEY?.trim()
    if (!apiKey) {
      throw new JobProviderError(
        "Jooble is not configured. Add JOOBLE_API_KEY to .env.local.",
        503,
        "PROVIDER_NOT_CONFIGURED"
      )
    }

    const host = (process.env.JOOBLE_HOST ?? "pk.jooble.org").trim()
    const location = resolveJobSearchLocation(query.location)
    const keywords = query.keyword?.trim() || "software engineer"

    let response: Response
    try {
      response = await fetch(`https://${host}/api/${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "ResumeAI/0.1",
        },
        body: JSON.stringify({
          keywords,
          location,
          radius: "40",
          page: "1",
          ResultOnPage: String(config.jobs.searchResultLimit),
          companysearch: "false",
        }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      })
    } catch {
      throw new JobProviderError(
        "The job listings service is unavailable. Please try again later.",
        503,
        "PROVIDER_UNAVAILABLE"
      )
    }

    if (response.status === 403) {
      throw new JobProviderError(
        "Jooble rejected the API key. Check JOOBLE_API_KEY and that it was created on pk.jooble.org.",
        403,
        "PROVIDER_FORBIDDEN"
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

    const payload = (await response.json().catch(() => null)) as { jobs?: unknown } | null
    if (!payload || !Array.isArray(payload.jobs)) {
      throw new JobProviderError("The job listings service returned an invalid response.", 502, "INVALID_RESPONSE")
    }

    return filterSearchJobs(
      payload.jobs
        .map((item) => this.toProviderJob(item as JoobleJob))
        .filter((job): job is ProviderJob => Boolean(job)),
      query
    ).slice(0, config.jobs.searchResultLimit)
  }

  private toProviderJob(item: JoobleJob): ProviderJob | null {
    const title = firstNonEmpty(typeof item.title === "string" ? item.title : "")
    const sourceUrl = firstNonEmpty(typeof item.link === "string" ? item.link : "")
    if (!title || !sourceUrl) return null

    const snippet = stripHtml(typeof item.snippet === "string" ? item.snippet : "")
    const salary = typeof item.salary === "string" ? item.salary.trim() : ""
    const description = [snippet, salary ? `Salary: ${salary}.` : ""].filter(Boolean).join(" ")
    if (description.length < 20) return null

    const postedDate =
      typeof item.updated === "string" && !Number.isNaN(Date.parse(item.updated))
        ? new Date(item.updated)
        : new Date()

    return {
      title,
      company: firstNonEmpty(typeof item.company === "string" ? item.company : "", "Pakistan employer"),
      location: firstNonEmpty(typeof item.location === "string" ? item.location : "", "Pakistan"),
      description: description.slice(0, 20000),
      employmentType: mapEmploymentType(typeof item.type === "string" ? item.type : ""),
      requiredSkills: [],
      preferredSkills: [],
      source: "api",
      sourceUrl,
      postedDate,
    }
  }
}
