import type { EmploymentType, JobSource } from "@/types/job"
import { config } from "@/lib/config"
import { AdzunaJobProvider } from "@/services/jobs/adzuna-provider"
import { JobDataApiProvider } from "@/services/jobs/jobdata-provider"
import { JoobleJobProvider } from "@/services/jobs/jooble-provider"
import { SkillzDunyaJobProvider } from "@/services/jobs/skillzdunya-provider"
import { RemotiveJobProvider } from "@/services/jobs/remotive-provider"
import { RemoteOkJobProvider } from "@/services/jobs/remoteok-provider"
import { filterSearchJobs } from "@/services/jobs/normalize-job"

export type ProviderJob = {
  title: string
  company: string
  location: string
  description: string
  employmentType: EmploymentType
  requiredSkills: string[]
  preferredSkills: string[]
  source: JobSource
  sourceUrl: string
  postedDate: Date
}

export type JobSearchQuery = {
  keyword?: string
  location?: string
  jobType?: string
  postedWithin?: string
}

export class JobProviderError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 502, code = "JOB_PROVIDER_ERROR") {
    super(message)
    this.name = "JobProviderError"
    this.status = status
    this.code = code
  }
}

export interface JobProvider {
  id: string
  search(query: JobSearchQuery): Promise<ProviderJob[]>
}

export class FallbackJobProvider implements JobProvider {
  id: string

  constructor(private readonly providers: JobProvider[]) {
    this.id = providers[0]?.id ?? "jobs"
  }

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    let lastError: unknown
    let emptySuccess = false

    for (const provider of this.providers) {
      try {
        const jobs = await provider.search(query)
        if (jobs.length > 0) {
          this.id = provider.id
          return jobs
        }
        emptySuccess = true
      } catch (error) {
        lastError = error
      }
    }

    if (emptySuccess) {
      this.id = this.providers[0]?.id ?? "jobs"
      return []
    }

    if (lastError instanceof JobProviderError) throw lastError
    throw new JobProviderError(
      "The job listings service is unavailable. Please try again later.",
      503,
      "PROVIDER_UNAVAILABLE"
    )
  }
}

export class FirstSuccessJobProvider implements JobProvider {
  id: string

  constructor(private readonly providers: JobProvider[]) {
    this.id = providers[0]?.id ?? "jobs"
  }

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    if (this.providers.length === 0) {
      throw new JobProviderError(
        "The job listings service is unavailable. Please try again later.",
        503,
        "PROVIDER_UNAVAILABLE"
      )
    }

    return await new Promise<ProviderJob[]>((resolve, reject) => {
      let remaining = this.providers.length
      let lastError: unknown
      let emptySuccess = false
      let settled = false

      const finish = (jobs: ProviderJob[] = []) => {
        if (settled) return
        settled = true
        resolve(jobs)
      }

      const fail = (error: unknown) => {
        if (settled) return
        settled = true
        if (error instanceof JobProviderError) {
          reject(error)
          return
        }
        reject(
          new JobProviderError(
            "The job listings service is unavailable. Please try again later.",
            503,
            "PROVIDER_UNAVAILABLE"
          )
        )
      }

      for (const provider of this.providers) {
        Promise.resolve(provider.search(query))
          .then((jobs) => {
            remaining -= 1
            if (settled) return
            if (jobs.length > 0) {
              this.id = provider.id
              finish(jobs)
              return
            }
            emptySuccess = true
            if (remaining === 0) finish([])
          })
          .catch((error) => {
            remaining -= 1
            lastError = error
            if (settled) return
            if (remaining === 0) {
              if (emptySuccess) finish([])
              else fail(lastError)
            }
          })
      }
    })
  }
}

export class MergedJobProvider implements JobProvider {
  id: string

  constructor(private readonly providers: JobProvider[]) {
    this.id = providers[0]?.id ?? "jobs"
  }

  async search(query: JobSearchQuery): Promise<ProviderJob[]> {
    if (this.providers.length === 0) {
      throw new JobProviderError(
        "The job listings service is unavailable. Please try again later.",
        503,
        "PROVIDER_UNAVAILABLE"
      )
    }

    const results = await Promise.allSettled(this.providers.map((provider) => provider.search(query)))
    const collected: ProviderJob[] = []
    let lastError: unknown
    let emptySuccess = false
    let sourceId = this.providers[0]?.id ?? "jobs"

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        if (result.value.length > 0) {
          sourceId = this.providers[index]?.id ?? sourceId
          collected.push(...result.value)
        } else {
          emptySuccess = true
        }
        return
      }
      lastError = result.reason
    })

    const seen = new Set<string>()
    const merged = collected.filter((job) => {
      const key = job.sourceUrl.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (merged.length > 0) {
      this.id = sourceId
      return filterSearchJobs(merged, query).slice(0, config.jobs.searchResultLimit)
    }

    if (emptySuccess) {
      this.id = this.providers[0]?.id ?? "jobs"
      return []
    }

    if (lastError instanceof JobProviderError) throw lastError
    throw new JobProviderError(
      "The job listings service is unavailable. Please try again later.",
      503,
      "PROVIDER_UNAVAILABLE"
    )
  }
}

export function hasPrivateSectorJobApi(): boolean {
  return Boolean(
    process.env.JOOBLE_API_KEY?.trim() ||
      (process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim())
  )
}

export function createJobProvider(): JobProvider {
  const provider = (process.env.JOB_PROVIDER ?? "auto").trim().toLowerCase()
  if (provider === "adzuna") return new AdzunaJobProvider()
  if (provider === "jooble") return new JoobleJobProvider()
  if (provider === "jobdata") return new JobDataApiProvider()
  if (provider === "skillzdunya") return new SkillzDunyaJobProvider()
  if (provider === "remoteok") return new RemoteOkJobProvider()
  if (provider === "remotive") {
    return new FallbackJobProvider([new RemotiveJobProvider(), new RemoteOkJobProvider()])
  }

  const chain: JobProvider[] = []
  if (process.env.JOOBLE_API_KEY?.trim()) chain.push(new JoobleJobProvider())
  chain.push(new SkillzDunyaJobProvider(), new JobDataApiProvider())
  if (process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim()) {
    chain.push(new AdzunaJobProvider())
  }
  return new MergedJobProvider(chain)
}
