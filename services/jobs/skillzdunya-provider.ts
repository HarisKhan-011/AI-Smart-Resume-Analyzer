import { config } from "@/lib/config"
import {
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import {
  firstNonEmpty,
  filterSearchJobs,
  pakistanSearchCity,
} from "@/services/jobs/normalize-job"

type SkillzCity = { title?: unknown; slug?: unknown }
type SkillzOrg = { title?: unknown }

type SkillzJob = {
  title?: unknown
  url?: unknown
  apply_url?: unknown
  source_url?: unknown
  published_at?: unknown
  is_expired?: unknown
  salary_range?: unknown
  education_required?: unknown
  experience_required?: unknown
  organization?: SkillzOrg | null
  cities?: SkillzCity[] | null
}

const SKILLZDUNYA_URL = "https://skillzdunya.com/api/v1/jobs"
const ROLE_FALLBACKS = ["developer", "programmer", "react", "python", "java", "designer", "frontend", "backend"]
const GENERIC_ROLES = new Set(["engineer", "manager", "analyst", "officer", "specialist", "assistant"])

function keywordQueries(keyword?: string): string[] {
  const trimmed = keyword?.trim()
  if (!trimmed) return [""]

  const queries = [trimmed]
  const lower = trimmed.toLowerCase()
  const tokens = lower.split(/\s+/).filter((token) => token.length >= 4)
  const role = ROLE_FALLBACKS.find((roleToken) => tokens.some((token) => token.includes(roleToken)))
  if (role && role !== lower && !GENERIC_ROLES.has(role)) queries.push(role)
  if (/\bsoftware\b/.test(lower)) {
    queries.push("software developer", "developer")
  }
  if (/\b(ui|ux|graphic|designer|design)\b/.test(lower)) {
    queries.push("designer", "graphic designer")
  }
  return [...new Set(queries)].slice(0, 4)
}

function jobLocation(item: SkillzJob, query: JobSearchQuery): string {
  const cities = (item.cities ?? [])
    .map((city) => (typeof city.title === "string" ? city.title.trim() : ""))
    .filter(Boolean)
  const requested = pakistanSearchCity(query.location)
  if (requested && cities.some((city) => city.toLowerCase() === requested.toLowerCase())) {
    return `${requested}, Pakistan`
  }
  if (cities[0]) return `${cities[0]}, Pakistan`
  return "Pakistan"
}

function toProviderJob(item: SkillzJob, query: JobSearchQuery): ProviderJob | null {
  if (item.is_expired === true) return null

  const title = firstNonEmpty(typeof item.title === "string" ? item.title : "")
  const company = firstNonEmpty(
    typeof item.organization?.title === "string" ? item.organization.title : "",
    "Pakistan employer"
  )
  const sourceUrl = firstNonEmpty(
    typeof item.apply_url === "string" ? item.apply_url : "",
    typeof item.source_url === "string" ? item.source_url : "",
    typeof item.url === "string" ? item.url : ""
  )
  if (!title || !sourceUrl) return null

  const location = jobLocation(item, query)
  const description = [
    title,
    `${company} is hiring in ${location}.`,
    typeof item.education_required === "string" ? `Education: ${item.education_required}.` : "",
    typeof item.experience_required === "string" ? `Experience: ${item.experience_required}.` : "",
    typeof item.salary_range === "string" ? `Salary: ${item.salary_range}.` : "",
  ]
    .filter(Boolean)
    .join(" ")

  const postedDate =
    typeof item.published_at === "string" && !Number.isNaN(Date.parse(item.published_at))
      ? new Date(item.published_at)
      : new Date()

  return {
    title,
    company,
    location,
    description: description.slice(0, 20000),
    employmentType: "full-time",
    requiredSkills: [],
    preferredSkills: [],
    source: "api",
    sourceUrl,
    postedDate,
  }
}

export class SkillzDunyaJobProvider implements JobProvider {
  readonly id = "skillzdunya"

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    const city = pakistanSearchCity(query.location)
    const results = await Promise.allSettled(
      keywordQueries(query.keyword).map((keyword) => this.fetchJobs(keyword, city))
    )

    const collected: SkillzJob[] = []
    let lastError: unknown
    let fetched = false

    for (const result of results) {
      if (result.status === "fulfilled") {
        fetched = true
        collected.push(...result.value)
        continue
      }
      lastError = result.reason
    }

    if (!fetched) {
      if (lastError instanceof JobProviderError) throw lastError
      throw new JobProviderError(
        "The job listings service is unavailable. Please try again later.",
        503,
        "PROVIDER_UNAVAILABLE"
      )
    }

    const seen = new Set<string>()
    const jobs = collected
      .map((item) => toProviderJob(item, query))
      .filter((job): job is ProviderJob => {
        if (!job) return false
        const key = job.sourceUrl.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

    return filterSearchJobs(jobs, query).slice(0, config.jobs.searchResultLimit)
  }

  private async fetchJobs(keyword: string, city?: string): Promise<SkillzJob[]> {
    const params = new URLSearchParams({ per_page: "40" })
    if (keyword) params.set("q", keyword)
    if (city) params.set("city", city.toLowerCase())

    let response: Response
    try {
      response = await fetch(`${SKILLZDUNYA_URL}?${params.toString()}`, {
        headers: { Accept: "application/json", "User-Agent": "ResumeAI/0.1" },
        signal: AbortSignal.timeout(6000),
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

    const payload = (await response.json().catch(() => null)) as { data?: unknown } | null
    if (!payload || !Array.isArray(payload.data)) {
      throw new JobProviderError("The job listings service returned an invalid response.", 502, "INVALID_RESPONSE")
    }

    return payload.data as SkillzJob[]
  }
}
