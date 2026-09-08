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
  mapEmploymentType,
  stripHtml,
} from "@/services/jobs/normalize-job"

type JobDataCompany = {
  name?: unknown
}

type JobDataType = {
  name?: unknown
}

type JobDataJob = {
  title?: unknown
  description?: unknown
  location?: unknown
  published?: unknown
  application_url?: unknown
  company?: JobDataCompany | null
  types?: JobDataType[] | null
}

const JOBDATA_URL = "https://jobdataapi.com/api/jobs/"
const FEED_PAGES = 1

type FeedCache = {
  jobs: ProviderJob[]
  expiresAt: number
}

let feedCache: FeedCache | null = null
let feedInflight: Promise<ProviderJob[]> | null = null

export function resetJobDataApiCache() {
  feedCache = null
  feedInflight = null
}

function toProviderJob(item: JobDataJob): ProviderJob | null {
  const title = firstNonEmpty(typeof item.title === "string" ? item.title : "")
  const company = firstNonEmpty(typeof item.company?.name === "string" ? item.company.name : "")
  const sourceUrl = firstNonEmpty(typeof item.application_url === "string" ? item.application_url : "")
  if (!title || !company || !sourceUrl) return null

  const description = stripHtml(typeof item.description === "string" ? item.description : "")
  if (description.length < 20) return null

  const postedDate =
    typeof item.published === "string" && !Number.isNaN(Date.parse(item.published))
      ? new Date(item.published)
      : new Date()

  const employmentTypeName = Array.isArray(item.types)
    ? item.types.find((entry) => typeof entry?.name === "string")?.name
    : ""

  return {
    title,
    company,
    location: firstNonEmpty(typeof item.location === "string" ? item.location : "", "Pakistan"),
    description: description.slice(0, 20000),
    employmentType: mapEmploymentType(typeof employmentTypeName === "string" ? employmentTypeName : ""),
    requiredSkills: [],
    preferredSkills: [],
    source: "api",
    sourceUrl,
    postedDate,
  }
}

function dedupeJobs(jobs: ProviderJob[]): ProviderJob[] {
  const seen = new Set<string>()
  return jobs.filter((job) => {
    const key = job.sourceUrl.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function filterPakistanFeed(jobs: ProviderJob[], query: JobSearchQuery): ProviderJob[] {
  return filterSearchJobs(jobs, query).slice(0, config.jobs.searchResultLimit)
}

async function fetchPakistanPage(page: number): Promise<ProviderJob[]> {
  const params = new URLSearchParams({ country_code: "PK" })
  if (page > 1) params.set("page", String(page))

  const response = await fetch(`${JOBDATA_URL}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": "ResumeAI/0.1" },
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  })

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

  return payload.results
    .map((item) => toProviderJob(item as JobDataJob))
    .filter((job): job is ProviderJob => Boolean(job))
}

async function fetchPakistanFeed(): Promise<ProviderJob[]> {
  const collected: ProviderJob[] = []

  for (let page = 1; page <= FEED_PAGES; page += 1) {
    try {
      collected.push(...(await fetchPakistanPage(page)))
    } catch (error) {
      if (collected.length > 0) break
      throw error
    }
  }

  return dedupeJobs(collected)
}

async function loadPakistanFeed(): Promise<ProviderJob[]> {
  if (feedCache && feedCache.jobs.length > 0 && Date.now() < feedCache.expiresAt) {
    return feedCache.jobs
  }
  if (feedInflight) return feedInflight

  feedInflight = (async () => {
    try {
      const jobs = await fetchPakistanFeed()
      feedCache = {
        jobs,
        expiresAt: Date.now() + config.jobs.feedCacheTtlMs,
      }
      return jobs
    } catch (error) {
      if (feedCache?.jobs.length) return feedCache.jobs
      throw error
    } finally {
      feedInflight = null
    }
  })()

  return feedInflight
}

export class JobDataApiProvider implements JobProvider {
  readonly id = "jobdata"

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    let feed: ProviderJob[]
    try {
      feed = await loadPakistanFeed()
    } catch (error) {
      if (error instanceof JobProviderError) throw error
      throw new JobProviderError(
        "The job listings service is unavailable. Please try again later.",
        503,
        "PROVIDER_UNAVAILABLE"
      )
    }

    return filterPakistanFeed(feed, query)
  }
}
