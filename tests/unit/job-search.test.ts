import { afterEach, describe, expect, it, jest } from "@jest/globals"
import {
  formatEmploymentType,
  isPakistanJob,
  jobSourceLabel,
  mapEmploymentType,
  matchesJobKeyword,
  matchesJobLocation,
  matchesJobSearch,
  resolveJobSearchLocation,
  stripHtml,
} from "@/services/jobs/normalize-job"
import { RemotiveJobProvider } from "@/services/jobs/remotive-provider"
import { RemoteOkJobProvider } from "@/services/jobs/remoteok-provider"
import { JobDataApiProvider, resetJobDataApiCache } from "@/services/jobs/jobdata-provider"
import { SkillzDunyaJobProvider } from "@/services/jobs/skillzdunya-provider"
import { AdzunaJobProvider } from "@/services/jobs/adzuna-provider"
import { JoobleJobProvider } from "@/services/jobs/jooble-provider"
import {
  FallbackJobProvider,
  FirstSuccessJobProvider,
  JobProviderError,
  MergedJobProvider,
} from "@/services/jobs/job-provider"
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
  resetJobDataApiCache()
  delete process.env.ADZUNA_APP_ID
  delete process.env.ADZUNA_APP_KEY
  delete process.env.JOOBLE_API_KEY
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
    expect(jobSourceLabel("api", "https://remoteok.com/remote-jobs/1")).toBe("RemoteOK")
    expect(jobSourceLabel("api", "https://skillzdunya.com/job/1")).toBe("Pakistan")
    expect(jobSourceLabel("api", "https://jobdataapi.com/api/jobs/1")).toBe("Pakistan")
    expect(jobSourceLabel("api", "https://pk.jooble.org/jdp/1")).toBe("Jooble")
    expect(jobSourceLabel("api")).toBe("Online")
  })

  it("defaults empty location searches to Pakistan", () => {
    expect(resolveJobSearchLocation("")).toBe("Pakistan")
    expect(resolveJobSearchLocation("  ")).toBe("Pakistan")
    expect(resolveJobSearchLocation("Lahore")).toBe("Lahore")
  })

  it("keeps only Pakistan jobs and city-matches Lahore", () => {
    expect(isPakistanJob("Lahore, Pakistan")).toBe(true)
    expect(isPakistanJob("Karachi")).toBe(true)
    expect(isPakistanJob("Worldwide")).toBe(false)
    expect(isPakistanJob("Remote")).toBe(false)
    expect(isPakistanJob("Hyderabad, India")).toBe(false)
    expect(isPakistanJob("Hyderabad, Pakistan")).toBe(true)

    expect(matchesJobLocation("Lahore, Pakistan", "Lahore")).toBe(true)
    expect(matchesJobLocation("Lahore, Punjab, Pakistan", "Lahore, Pakistan")).toBe(true)
    expect(matchesJobLocation("Karachi, Pakistan", "Lahore")).toBe(false)
    expect(matchesJobLocation("Pakistan", "Lahore")).toBe(false)
    expect(matchesJobLocation("Lahore, Pakistan", "Pakistan")).toBe(true)
    expect(matchesJobLocation("Islamabad, Pakistan", "")).toBe(true)
    expect(matchesJobLocation("Worldwide", "Lahore, Pakistan")).toBe(false)
    expect(matchesJobLocation("Remote", "Lahore, Pakistan")).toBe(false)
    expect(matchesJobLocation("Europe", "Lahore, Pakistan")).toBe(false)
    expect(matchesJobLocation("Karachi, Pakistan - Remote", "Karachi")).toBe(true)
  })

  it("matches keywords with all terms, or any comma-separated alternative", () => {
    const job = {
      title: "Frontend Developer",
      company: "Acme",
      description: "Build React interfaces for production users.",
      requiredSkills: ["React"],
    }
    expect(matchesJobKeyword(job, "")).toBe(true)
    expect(matchesJobKeyword(job, "Frontend developer")).toBe(true)
    expect(matchesJobKeyword(job, "React")).toBe(true)
    expect(matchesJobKeyword(job, "Python")).toBe(false)
    expect(matchesJobKeyword(job, "Python, React")).toBe(true)
    expect(
      matchesJobKeyword(
        { ...job, title: "Senior Fullstack Developer", requiredSkills: [] },
        "Frontend developer"
      )
    ).toBe(true)
    expect(
      matchesJobKeyword(
        { title: "Associate Software Engineer", company: "Agile District", description: "Build apps.", requiredSkills: [] },
        "software engineer"
      )
    ).toBe(true)
    expect(
      matchesJobKeyword(
        { title: "Web Developer", company: "Private Company", description: "HTML CSS jobs.", requiredSkills: [] },
        "software engineer"
      )
    ).toBe(true)
    expect(
      matchesJobKeyword(
        { title: "React JS Intern", company: "Digixvalley", description: "Build React apps.", requiredSkills: [] },
        "software engineer"
      )
    ).toBe(true)
    expect(
      matchesJobKeyword(
        { title: "Software Quality Assurance Engineer", company: "Arrivy", description: "QA testing.", requiredSkills: [] },
        "software engineer"
      )
    ).toBe(true)
    expect(
      matchesJobKeyword(
        { title: "Energy Department Lahore Jobs 2026 — Resident Engineer", company: "Energy Department", description: "Hydel projects.", requiredSkills: [] },
        "software engineer"
      )
    ).toBe(false)
    expect(
      matchesJobKeyword(
        { title: "Sweeper", company: "Market Committee", description: "Cleaning staff.", requiredSkills: [] },
        "Frontend developer"
      )
    ).toBe(false)
    expect(
      matchesJobKeyword(
        { title: "Graphics Designer", company: "KP Jobs", description: "Create visual designs.", requiredSkills: [] },
        "ui ux designer"
      )
    ).toBe(true)
    expect(
      matchesJobKeyword(
        { title: "Gourmet Female Interior Designer", company: "Gourmet", description: "Interior design.", requiredSkills: [] },
        "ui ux designer"
      )
    ).toBe(false)
  })

  it("applies keyword, city, and job-type filters together", () => {
    const job = {
      title: "Frontend Developer",
      company: "Acme",
      location: "Lahore, Pakistan",
      description: "Build React apps.",
      employmentType: "full-time" as const,
      requiredSkills: ["React"],
    }
    expect(matchesJobSearch(job, { keyword: "frontend", location: "Lahore", jobType: "full-time" })).toBe(true)
    expect(matchesJobSearch(job, { keyword: "frontend", location: "Karachi", jobType: "full-time" })).toBe(false)
    expect(matchesJobSearch(job, { keyword: "python", location: "Lahore", jobType: "all" })).toBe(false)
    expect(matchesJobSearch(job, { keyword: "", location: "Pakistan", jobType: "internship" })).toBe(false)
  })

  it("filters jobs by date posted", () => {
    const recent = {
      title: "Frontend Developer",
      company: "Acme",
      location: "Lahore, Pakistan",
      description: "Build React apps.",
      employmentType: "full-time" as const,
      requiredSkills: ["React"],
      postedDate: new Date(),
    }
    const old = {
      ...recent,
      postedDate: new Date("2020-01-01"),
    }
    expect(matchesJobSearch(recent, { location: "Lahore", postedWithin: "24h" })).toBe(true)
    expect(matchesJobSearch(old, { location: "Lahore", postedWithin: "24h" })).toBe(false)
    expect(matchesJobSearch(old, { location: "Lahore", postedWithin: "all" })).toBe(true)
    expect(
      matchesJobSearch(
        { ...recent, postedDate: new Date("2023-10-16") },
        { location: "Lahore", postedWithin: "24h" }
      )
    ).toBe(false)
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
            candidate_required_location: "Pakistan",
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

    const jobs = await new RemotiveJobProvider().search({ keyword: "react", location: "Pakistan" })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      title: "React Engineer",
      company: "Remotive Co",
      location: "Pakistan",
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
            candidate_required_location: "Lahore, Pakistan",
            description: "Node.js role with enough text to pass validation here.",
            job_type: "contract",
            url: "https://remotive.com/remote-jobs/software-dev/456",
          },
          {
            title: "Backend Engineer US",
            company_name: "Remote Labs",
            candidate_required_location: "Karachi, Pakistan",
            description: "Node.js role with enough text to pass validation here.",
            job_type: "full_time",
            url: "https://remotive.com/remote-jobs/software-dev/457",
          },
        ],
      })
    )

    const jobs = await new RemotiveJobProvider().search({
      keyword: "node",
      location: "Lahore",
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

  it("does not treat worldwide listings as Pakistan jobs", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        jobs: [
          {
            title: "MERN Developer",
            company_name: "Remote Labs",
            candidate_required_location: "Worldwide",
            description: "MongoDB Express React Node.js role with enough text to pass validation.",
            job_type: "full_time",
            url: "https://remotive.com/remote-jobs/software-dev/mern",
          },
        ],
      })
    )

    const jobs = await new RemotiveJobProvider().search({
      keyword: "mern",
      location: "Lahore, Pakistan",
    })
    expect(jobs).toHaveLength(0)
  })
})

describe("RemoteOK job provider", () => {
  it("normalizes listings and ignores the legal banner row", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, [
        { last_updated: 1, legal: "notice" },
        {
          position: "React Engineer",
          company: "RemoteOK Co",
          location: "Lahore, Pakistan",
          description: "<p>We need JavaScript and React experience for this role.</p>",
          url: "https://remoteok.com/remote-jobs/react-1",
          tags: ["javascript", "react"],
          epoch: 1700000000,
        },
        {
          position: "Worldwide React Engineer",
          company: "RemoteOK Co",
          location: "Worldwide",
          description: "<p>We need JavaScript and React experience for this role.</p>",
          url: "https://remoteok.com/remote-jobs/react-world",
          tags: ["javascript", "react"],
          epoch: 1700000000,
        },
      ])
    )

    const jobs = await new RemoteOkJobProvider().search({ keyword: "react" })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      title: "React Engineer",
      company: "RemoteOK Co",
      location: "Lahore, Pakistan",
      source: "api",
      sourceUrl: "https://remoteok.com/remote-jobs/react-1",
    })
  })
})

describe("JobDataAPI provider", () => {
  const pakistanFeed = {
    results: [
      {
        title: "MERN Developer",
        company: { name: "Devsinc" },
        location: "Lahore, Pakistan",
        description: "<p>MongoDB Express React Node.js role with enough text to pass validation.</p>",
        application_url: "https://example.com/jobs/mern-lahore",
        published: "2026-09-01T00:00:00Z",
        types: [{ name: "Full Time" }],
      },
      {
        title: "Finance Analyst",
        company: { name: "Another Co" },
        location: "Karachi, Pakistan",
        description: "<p>Accounts payable and receivable role with enough text to pass validation.</p>",
        application_url: "https://example.com/jobs/finance-karachi",
        published: "2026-09-01T00:00:00Z",
        types: [{ name: "Full Time" }],
      },
    ],
  }

  it("shows all Pakistan jobs when no keyword is selected", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse(200, pakistanFeed))

    const jobs = await new JobDataApiProvider().search({ location: "Pakistan" })
    expect(jobs).toHaveLength(2)
    expect(jobs.map((job) => job.location).sort()).toEqual(["Karachi, Pakistan", "Lahore, Pakistan"])
  })

  it("filters the cached Pakistan feed by keyword and city", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse(200, pakistanFeed))

    const jobs = await new JobDataApiProvider().search({
      keyword: "mern",
      location: "Lahore",
    })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      title: "MERN Developer",
      company: "Devsinc",
      location: "Lahore, Pakistan",
      employmentType: "full-time",
      source: "api",
      sourceUrl: "https://example.com/jobs/mern-lahore",
    })
  })

  it("loads the Pakistan country feed once and reuses it", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse(200, pakistanFeed))
    const provider = new JobDataApiProvider()

    await provider.search({ keyword: "mern", location: "Lahore" })
    await provider.search({ keyword: "finance", location: "Karachi" })

    const urls = fetchSpy.mock.calls.map((call) => String(call[0]))
    expect(urls[0]).toContain("country_code=PK")
    expect(urls[0]).not.toContain("title=")
    expect(urls.every((url) => url.includes("country_code=PK"))).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("serves cached jobs when the live feed is rate-limited", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(200, pakistanFeed))
      .mockResolvedValueOnce(jsonResponse(200, { results: [] }))
      .mockResolvedValue(jsonResponse(429, {}))

    const provider = new JobDataApiProvider()
    const first = await provider.search({ location: "Pakistan" })
    expect(first).toHaveLength(2)

    const cached = await provider.search({ keyword: "mern", location: "Lahore" })
    expect(cached).toHaveLength(1)
    expect(cached[0]?.title).toBe("MERN Developer")
  })
})

describe("SkillzDunya job provider", () => {
  it("returns Pakistan jobs when no keyword is selected", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        data: [
          {
            title: "Energy Department Lahore Jobs 2026 — Resident Engineer",
            organization: { title: "Energy Department" },
            url: "https://skillzdunya.com/job/energy-lahore",
            apply_url: "https://jobs.punjab.gov.pk/energy",
            published_at: "2026-09-05",
            is_expired: false,
            education_required: "Bachelors",
            experience_required: "2 years",
            salary_range: "BPS-17",
            cities: [{ title: "Lahore", slug: "lahore" }],
          },
          {
            title: "Karachi Port Trust Jobs 2026",
            organization: { title: "KPT" },
            url: "https://skillzdunya.com/job/kpt",
            source_url: "https://kpt.gov.pk/jobs",
            published_at: "2026-09-04",
            cities: [{ title: "Karachi", slug: "karachi" }],
          },
        ],
      })
    )

    const jobs = await new SkillzDunyaJobProvider().search({ location: "Pakistan" })
    expect(jobs).toHaveLength(2)
    expect(jobs[0]).toMatchObject({
      title: "Energy Department Lahore Jobs 2026 — Resident Engineer",
      company: "Energy Department",
      location: "Lahore, Pakistan",
      source: "api",
    })
  })

  it("broadens Frontend developer to developer when the exact phrase is empty", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: [
            {
              title: "Senior Fullstack Developer",
              organization: { title: "KPITB" },
              url: "https://skillzdunya.com/job/fullstack",
              cities: [{ title: "Peshawar", slug: "peshawar" }],
            },
          ],
        })
      )

    const jobs = await new SkillzDunyaJobProvider().search({
      keyword: "Frontend developer",
      location: "Pakistan",
    })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.title).toBe("Senior Fullstack Developer")
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("q=Frontend+developer")
    expect(String(fetchSpy.mock.calls[1]?.[0])).toContain("q=developer")
  })

  it("does not broaden software engineer to every engineer job", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        data: [
          {
            title: "Energy Department Lahore Jobs 2026 — Resident Engineer",
            organization: { title: "Energy Department" },
            url: "https://skillzdunya.com/job/energy-lahore",
            cities: [{ title: "Lahore", slug: "lahore" }],
          },
          {
            title: "Associate Software Engineer",
            organization: { title: "Agile District" },
            url: "https://skillzdunya.com/job/ase",
            cities: [{ title: "Lahore", slug: "lahore" }],
          },
        ],
      })
    )

    const jobs = await new SkillzDunyaJobProvider().search({
      keyword: "software engineer",
      location: "Lahore",
    })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.title).toBe("Associate Software Engineer")
    const urls = fetchSpy.mock.calls.map((call) => String(call[0]))
    expect(urls.some((url) => url.includes("q=software+engineer"))).toBe(true)
    expect(urls.some((url) => url.includes("q=developer"))).toBe(true)
    expect(urls.every((url) => !url.includes("q=engineer&") && !url.endsWith("q=engineer"))).toBe(true)
  })

  it("uses developer listings when software engineer has no exact matches", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input)
        if (url.includes("q=developer") && !url.includes("software")) {
          return jsonResponse(200, {
            data: [
              {
                title: "Web Developer Lahore Jobs 2026 — Web Developer",
                organization: { title: "Private Company" },
                url: "https://skillzdunya.com/job/web-dev-lahore",
                published_at: "2023-10-16",
                cities: [{ title: "Lahore", slug: "lahore" }],
              },
            ],
          })
        }
        return jsonResponse(200, {
          data: [
            {
              title: "Information Technology University (ITU) Lahore Jobs 2026 — Programme Officer",
              organization: { title: "ITU" },
              url: "https://skillzdunya.com/job/itu-officer",
              published_at: "2026-09-02",
              cities: [{ title: "Lahore", slug: "lahore" }],
            },
          ],
        })
      })

    const jobs = await new SkillzDunyaJobProvider().search({
      keyword: "software engineer",
      location: "Lahore",
    })
    expect(jobs.map((job) => job.title)).toEqual(["Web Developer Lahore Jobs 2026 — Web Developer"])
  })

  it("does not return 2023 listings when date posted is last 24 hours", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        data: [
          {
            title: "Web Developer Lahore Jobs 2026 — Web Developer",
            organization: { title: "Private Company" },
            url: "https://skillzdunya.com/job/web-dev-lahore",
            apply_url: "https://example.com/apply/web-dev",
            published_at: "2023-10-16",
            cities: [{ title: "Lahore", slug: "lahore" }],
          },
          {
            title: "React Developer",
            organization: { title: "Netsol" },
            url: "https://skillzdunya.com/job/react-lahore",
            apply_url: "https://example.com/apply/react",
            published_at: new Date().toISOString(),
            cities: [{ title: "Lahore", slug: "lahore" }],
          },
        ],
      })
    )

    const jobs = await new SkillzDunyaJobProvider().search({
      keyword: "developer",
      location: "Lahore",
      postedWithin: "24h",
    })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.title).toBe("React Developer")
  })
})

describe("first-success job provider", () => {
  it("returns the first provider that has jobs without waiting on a failing API", async () => {
    const race = new FirstSuccessJobProvider([
      {
        id: "jobdata",
        search: async () => {
          await new Promise((resolve) => setTimeout(resolve, 80))
          throw new JobProviderError("down", 503, "PROVIDER_UNAVAILABLE")
        },
      },
      {
        id: "skillzdunya",
        search: async () => [
          {
            title: "Lahore Engineer",
            company: "ITU",
            location: "Lahore, Pakistan",
            description: "Engineering role with enough description text here.",
            employmentType: "full-time",
            requiredSkills: [],
            preferredSkills: [],
            source: "api",
            sourceUrl: "https://skillzdunya.com/job/itu",
            postedDate: new Date("2026-09-01"),
          },
        ],
      },
    ])

    const jobs = await race.search({ location: "Pakistan" })
    expect(jobs).toHaveLength(1)
    expect(race.id).toBe("skillzdunya")
    expect(jobs[0]?.title).toBe("Lahore Engineer")
  })
})

describe("merged job provider", () => {
  it("combines matching jobs and ignores a failing backup API", async () => {
    const merged = new MergedJobProvider([
      {
        id: "skillzdunya",
        search: async () => [
          {
            title: "Associate Software Engineer",
            company: "Agile District",
            location: "Lahore, Pakistan",
            description: "Software engineering role with enough description text here.",
            employmentType: "full-time",
            requiredSkills: [],
            preferredSkills: [],
            source: "api",
            sourceUrl: "https://skillzdunya.com/job/ase",
            postedDate: new Date("2026-09-06"),
          },
        ],
      },
      {
        id: "jobdata",
        search: async () => {
          throw new JobProviderError("down", 503, "PROVIDER_UNAVAILABLE")
        },
      },
    ])

    const jobs = await merged.search({ keyword: "software engineer", location: "Lahore" })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.title).toBe("Associate Software Engineer")
  })
})

describe("fallback job provider", () => {
  it("uses the next provider when the first one is unavailable", async () => {
    const fallback = new FallbackJobProvider([
      {
        id: "remotive",
        search: async () => {
          throw new JobProviderError("down", 503, "PROVIDER_UNAVAILABLE")
        },
      },
      {
        id: "remoteok",
        search: async () => [
          {
            title: "MERN Developer",
            company: "Fallback Co",
            location: "Lahore, Pakistan",
            description: "MongoDB Express React Node with enough description text here.",
            employmentType: "full-time",
            requiredSkills: ["react"],
            preferredSkills: [],
            source: "api",
            sourceUrl: "https://remoteok.com/remote-jobs/mern-1",
            postedDate: new Date("2026-09-01"),
          },
        ],
      },
    ])

    const jobs = await fallback.search({ keyword: "mern", location: "Lahore, Pakistan" })
    expect(jobs).toHaveLength(1)
    expect(fallback.id).toBe("remoteok")
    expect(jobs[0]?.title).toBe("MERN Developer")
  })

  it("skips a provider that returns no matching jobs", async () => {
    const fallback = new FallbackJobProvider([
      {
        id: "remotive",
        search: async () => [],
      },
      {
        id: "jobdata",
        search: async () => [
          {
            title: "MERN Developer",
            company: "Lahore Co",
            location: "Lahore, Pakistan",
            description: "MongoDB Express React Node with enough description text here.",
            employmentType: "full-time",
            requiredSkills: ["react"],
            preferredSkills: [],
            source: "api",
            sourceUrl: "https://example.com/jobs/mern-lahore",
            postedDate: new Date("2026-09-01"),
          },
        ],
      },
    ])

    const jobs = await fallback.search({ keyword: "mern", location: "Lahore" })
    expect(jobs).toHaveLength(1)
    expect(fallback.id).toBe("jobdata")
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

describe("Jooble job provider", () => {
  it("fails when the API key is missing", async () => {
    await expect(new JoobleJobProvider().search({ keyword: "software engineer" })).rejects.toMatchObject({
      code: "PROVIDER_NOT_CONFIGURED",
      status: 503,
    })
  })

  it("returns Lahore software jobs from the Jooble payload", async () => {
    process.env.JOOBLE_API_KEY = "test-key"
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        totalCount: 2,
        jobs: [
          {
            title: "React JS Intern",
            company: "Digixvalley Pvt Ltd",
            location: "Lahore",
            snippet: "Assist in developing, testing, and maintaining React applications for production users.",
            type: "Full-time",
            link: "https://pk.jooble.org/jdp/react-intern",
            updated: "2026-09-06T10:00:00.0000000",
          },
          {
            title: "Warehouse Supervisor",
            company: "Logistics Co",
            location: "Karachi",
            snippet: "Supervise warehouse staff and inventory operations across multiple shifts.",
            type: "Full-time",
            link: "https://pk.jooble.org/jdp/warehouse",
            updated: "2026-09-06T10:00:00.0000000",
          },
        ],
      })
    )

    const jobs = await new JoobleJobProvider().search({
      keyword: "software engineer",
      location: "Lahore",
    })
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      title: "React JS Intern",
      company: "Digixvalley Pvt Ltd",
      location: "Lahore",
      source: "api",
    })
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("pk.jooble.org/api/test-key")
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
      { keyword: "react" },
      {
        searchAndStoreJobs: async (query) => {
          expect(query.location).toBe("Pakistan")
          return {
            jobs: [job],
            provider: "jobdata",
            fetched: 1,
          }
        },
      }
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { jobs: Job[]; provider: string }
    expect(body.provider).toBe("jobdata")
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

  it("falls back to Pakistan-wide jobs when the city has no keyword matches", async () => {
    const listing: ProviderJob = {
      title: "Graphics Designer",
      company: "KP Jobs",
      location: "Peshawar, Pakistan",
      description: "Create visual designs and brand assets for digital products.",
      employmentType: "full-time",
      requiredSkills: [],
      preferredSkills: [],
      source: "api",
      sourceUrl: "https://skillzdunya.com/job/graphics",
      postedDate: new Date(),
    }
    const search = jest
      .fn<(query: { location?: string }) => Promise<ProviderJob[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([listing])
    const save = jest.fn(async () => mockJob({ title: listing.title, location: listing.location }))

    const result = await searchAndStoreJobs(
      { keyword: "ui ux designer", location: "Lahore" },
      { id: "skillzdunya", search },
      save as never
    )

    expect(search).toHaveBeenCalledTimes(2)
    expect(search.mock.calls[1]?.[0]).toMatchObject({ location: "Pakistan" })
    expect(result.jobs).toHaveLength(1)
    expect(result.warning).toMatch(/Pakistan-wide/i)
  })

  it("returns saved jobs when live providers fail", async () => {
    const stored = mockJob({ title: "MERN Developer", location: "Worldwide" })
    const result = await searchAndStoreJobs(
      { keyword: "mern" },
      {
        id: "remotive",
        search: async () => {
          throw new JobProviderError("down", 503, "PROVIDER_UNAVAILABLE")
        },
      },
      jest.fn(async () => stored),
      async () => [stored]
    )

    expect(result.provider).toBe("saved")
    expect(result.warning).toMatch(/unavailable/i)
    expect(result.jobs).toHaveLength(1)
  })

  it("returns a warning instead of failing when live listings are rate-limited", async () => {
    const result = await searchAndStoreJobs(
      { keyword: "mern" },
      {
        id: "jobdata",
        search: async () => {
          throw new JobProviderError("rate limited", 429, "RATE_LIMITED")
        },
      },
      jest.fn(async () => mockJob()),
      async () => []
    )

    expect(result.jobs).toHaveLength(0)
    expect(result.warning).toMatch(/busy/i)
  })
})
