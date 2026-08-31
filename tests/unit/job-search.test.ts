import { afterEach, describe, expect, it, jest } from "@jest/globals"
import {
  formatEmploymentType,
  jobSourceLabel,
  mapEmploymentType,
  stripHtml,
} from "@/services/jobs/normalize-job"
import { RemotiveJobProvider } from "@/services/jobs/remotive-provider"
import { AdzunaJobProvider } from "@/services/jobs/adzuna-provider"
import { JobProviderError } from "@/services/jobs/job-provider"
import { searchAndStoreJobs } from "@/services/jobs/job-search-service"
import { handleSearchJobsRequest, handleGetJobRequest } from "@/services/job-http"
import { canAccessJob } from "@/services/job-service"
import type { Job } from "@/types/job"
import type { ProviderJob } from "@/services/jobs/job-provider"

const user = { id: "507f1f77bcf86cd799439012" }

function mockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "507f1f77bcf86cd799439033",
    title: "Frontend Developer",
    company: "Acme Inc",
    location: "Remote",
    description: "Build web apps with JavaScript and React.",
    requiredSkills: ["JavaScript", "React"],
    preferredSkills: ["TypeScript"],
    employmentType: "full-time",
    source: "api",
    sourceUrl: "https://remotive.com/remote-jobs/software-dev/1",
    postedDate: new Date("2026-08-31"),
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    createdBy: null,
    ...overrides,
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

afterEach(() => {
  jest.restoreAllMocks()
  delete process.env.ADZUNA_APP_ID
  delete process.env.ADZUNA_APP_KEY
})

describe("job listing normalization", () => {
  it("maps provider employment types", () => {
    expect(mapEmploymentType("full_time")).toBe("full-time")
    expect(mapEmploymentType("Part Time")).toBe("part-time")
    expect(mapEmploymentType("contractor")).toBe("contract")
    expect(mapEmploymentType("intern")).toBe("internship")
    expect(mapEmploymentType("unknown")).toBe("full-time")
    expect(formatEmploymentType("full-time")).toBe("Full-time")
  })

  it("strips HTML and decodes entities", () => {
    expect(stripHtml("<p>Build <strong>React</strong> apps&nbsp;&amp; APIs</p>")).toBe(
      "Build React apps & APIs"
    )
  })

  it("labels job sources from the listing URL", () => {
    expect(jobSourceLabel("manual")).toBe("Analyzed")
    expect(jobSourceLabel("api", "https://remotive.com/remote-jobs/1")).toBe("Remotive")
    expect(jobSourceLabel("api", "https://www.adzuna.co.uk/jobs/1")).toBe("Adzuna")
    expect(jobSourceLabel("api")).toBe("Online")
  })
})

describe("job access", () => {
  it("allows owners, public API jobs, and active recruiter postings", () => {
    expect(canAccessJob({ createdBy: user.id, source: "manual" }, user.id)).toBe(true)
    expect(canAccessJob({ createdBy: null, source: "api" }, user.id)).toBe(true)
    expect(canAccessJob({ createdBy: "someone-else", source: "manual" }, user.id)).toBe(false)
    expect(
      canAccessJob(
        { createdBy: "recruiter-1", source: "manual", isPosted: true, isActive: true },
        user.id
      )
    ).toBe(true)
    expect(
      canAccessJob(
        { createdBy: "recruiter-1", source: "manual", isPosted: true, isActive: false },
        user.id
      )
    ).toBe(false)
  })

  it("returns 404 when a job is not accessible", async () => {
    const response = await handleGetJobRequest(user, "missing-id", {
      getAccessibleJob: async () => null,
    })
    expect(response.status).toBe(404)
  })

  it("returns an API job to a signed-in user", async () => {
    const job = mockJob()
    const response = await handleGetJobRequest(user, job.id, {
      getAccessibleJob: async () => job,
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { job: Job }
    expect(body.job.source).toBe("api")
  })
})

describe("Remotive job provider", () => {
  it("normalizes listings and skips invalid rows", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        jobs: [
          {
            title: "React Engineer",
            company_name: "Remotive Co",
            candidate_required_location: "USA",
            description: "<p>We need JavaScript and React experience for this role.</p>",
            job_type: "full_time",
            url: "https://remotive.com/remote-jobs/software-dev/123",
            publication_date: "2026-08-01T00:00:00",
            tags: ["javascript", "react"],
          },
          {
            title: "",
            company_name: "Missing",
            url: "https://remotive.com/remote-jobs/software-dev/bad",
            description: "Too incomplete",
          },
        ],
      })
    )

    const jobs = await new RemotiveJobProvider().search({ keyword: "react", location: "usa" })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      title: "React Engineer",
      company: "Remotive Co",
      location: "USA",
      employmentType: "full-time",
      source: "api",
      sourceUrl: "https://remotive.com/remote-jobs/software-dev/123",
      requiredSkills: ["javascript", "react"],
    })
    expect(jobs[0]?.description).toContain("JavaScript")
  })

  it("filters by location and job type", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        jobs: [
          {
            title: "Backend Engineer",
            company_name: "Remote Labs",
            candidate_required_location: "Europe",
            description: "Node.js role with enough text to pass validation here.",
            job_type: "contract",
            url: "https://remotive.com/remote-jobs/software-dev/456",
          },
          {
            title: "Backend Engineer US",
            company_name: "Remote Labs",
            candidate_required_location: "USA",
            description: "Node.js role with enough text to pass validation here.",
            job_type: "full_time",
            url: "https://remotive.com/remote-jobs/software-dev/457",
          },
        ],
      })
    )

    const jobs = await new RemotiveJobProvider().search({
      keyword: "node",
      location: "europe",
      jobType: "contract",
    })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.sourceUrl).toContain("456")
  })

  it("throws a rate-limit error on 429", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse(429, {}))
    await expect(new RemotiveJobProvider().search({ keyword: "react" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    })
  })

  it("throws on an invalid payload", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse(200, { jobs: "nope" }))
    await expect(new RemotiveJobProvider().search({ keyword: "react" })).rejects.toBeInstanceOf(
      JobProviderError
    )
  })
})

describe("Adzuna job provider", () => {
  it("fails when API keys are missing", async () => {
    await expect(new AdzunaJobProvider().search({ keyword: "react" })).rejects.toMatchObject({
      code: "PROVIDER_NOT_CONFIGURED",
      status: 503,
    })
  })
})

describe("job search API", () => {
  it("rejects unauthenticated search", async () => {
    const response = await handleSearchJobsRequest(null, { keyword: "react" })
    expect(response.status).toBe(401)
  })

  it("returns saved jobs after a successful search", async () => {
    const job = mockJob()
    const response = await handleSearchJobsRequest(
      user,
      { keyword: "react", location: "remote" },
      {
        searchAndStoreJobs: async () => ({
          jobs: [job],
          provider: "remotive",
          fetched: 1,
        }),
      }
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { jobs: Job[]; provider: string }
    expect(body.provider).toBe("remotive")
    expect(body.jobs).toHaveLength(1)
  })

  it("returns an empty list when the provider finds nothing", async () => {
    const response = await handleSearchJobsRequest(
      user,
      { keyword: "zzzz" },
      {
        searchAndStoreJobs: async () => ({ jobs: [], provider: "remotive", fetched: 0 }),
      }
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { jobs: Job[] }
    expect(body.jobs).toHaveLength(0)
  })

  it("maps provider rate limits to HTTP 429", async () => {
    const response = await handleSearchJobsRequest(
      user,
      { keyword: "react" },
      {
        searchAndStoreJobs: async () => {
          throw new JobProviderError("rate limited", 429, "RATE_LIMITED")
        },
      }
    )
    expect(response.status).toBe(429)
  })
})

describe("search and store", () => {
  it("extracts skills and upserts each listing", async () => {
    const listing: ProviderJob = {
      title: "Node Engineer",
      company: "Acme",
      location: "Remote",
      description:
        "We need a developer with JavaScript and Node.js experience.\n\nPreferred:\nAWS and Docker.",
      employmentType: "full-time",
      requiredSkills: ["javascript"],
      preferredSkills: [],
      source: "api",
      sourceUrl: "https://remotive.com/remote-jobs/software-dev/999",
      postedDate: new Date("2026-08-31"),
    }

    const save = jest.fn(async (input: { sourceUrl?: string | null; requiredSkills?: string[] }) =>
      mockJob({
        title: listing.title,
        sourceUrl: input.sourceUrl,
        requiredSkills: input.requiredSkills ?? [],
      })
    )

    const result = await searchAndStoreJobs(
      { keyword: "node" },
      { id: "remotive", search: async () => [listing] },
      save as never
    )

    expect(result.fetched).toBe(1)
    expect(result.jobs).toHaveLength(1)
    expect(save).toHaveBeenCalledTimes(1)
    const saved = save.mock.calls[0]?.[0] as { source: string; sourceUrl: string; requiredSkills: string[] }
    expect(saved.source).toBe("api")
    expect(saved.sourceUrl).toBe(listing.sourceUrl)
    expect(saved.requiredSkills).toEqual(expect.arrayContaining(["JavaScript", "Node.js"]))
  })
})
