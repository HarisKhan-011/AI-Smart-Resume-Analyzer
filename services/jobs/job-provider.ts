import type { EmploymentType, JobSource } from "@/types/job"
import { AdzunaJobProvider } from "@/services/jobs/adzuna-provider"
import { RemotiveJobProvider } from "@/services/jobs/remotive-provider"

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
  readonly id: string
  search(query: JobSearchQuery): Promise<ProviderJob[]>
}

export function createJobProvider(): JobProvider {
  const provider = (process.env.JOB_PROVIDER ?? "remotive").trim().toLowerCase()
  if (provider === "adzuna") return new AdzunaJobProvider()
  return new RemotiveJobProvider()
}
