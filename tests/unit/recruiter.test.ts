import { describe, expect, it, jest } from "@jest/globals"
import {
  handleCreateRecruiterJobRequest,
  handleDeleteRecruiterJobRequest,
  handleListRecruiterJobsRequest,
  handleUpdateRecruiterJobRequest,
} from "@/services/recruiter/recruiter-http"
import { parseRecruiterSkills, RecruiterError } from "@/services/recruiter/recruiter-job-service"
import { calculateMatch } from "@/services/matching/match-service"
import type { Job } from "@/types/job"

const recruiter = { id: "507f1f77bcf86cd799439012", role: "recruiter" as const }
const candidate = { id: "507f1f77bcf86cd799439099", role: "candidate" as const }
const jobId = "507f1f77bcf86cd799439033"

function mockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: jobId,
    title: "Frontend Developer",
    company: "Acme",
    location: "Remote",
    description: "Build web apps with JavaScript and React for production users.",
    requiredSkills: ["JavaScript", "React"],
    preferredSkills: ["TypeScript"],
    employmentType: "full-time",
    source: "manual",
    sourceUrl: null,
    postedDate: new Date("2026-08-31"),
    isPosted: true,
    isActive: true,
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    createdBy: recruiter.id,
    ...overrides,
  }
}

describe("recruiter skill parsing", () => {
  it("maps dictionary aliases into canonical skill names", () => {
    expect(parseRecruiterSkills("JS, ReactJS, Node")).toEqual(
      expect.arrayContaining(["JavaScript", "React", "Node.js"])
    )
  })
})

describe("recruiter ranking uses Phase 8 matching", () => {
  it("scores required-skill coverage the same way as calculateMatch", () => {
    const result = calculateMatch({
      resumeSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
    })
    expect(result.overallScore).toBe(67)
    expect(result.missingSkills).toEqual(["AWS", "Docker"])
  })
})

describe("recruiter jobs API", () => {
  it("rejects unauthenticated requests", async () => {
    expect((await handleListRecruiterJobsRequest(null)).status).toBe(401)
    expect((await handleCreateRecruiterJobRequest(null, { title: "Role" })).status).toBe(401)
    expect((await handleUpdateRecruiterJobRequest(null, jobId, { isActive: false })).status).toBe(401)
    expect((await handleDeleteRecruiterJobRequest(null, jobId)).status).toBe(401)
  })

  it("forbids candidates from recruiter job APIs", async () => {
    expect((await handleListRecruiterJobsRequest(candidate)).status).toBe(403)
    expect((await handleCreateRecruiterJobRequest(candidate, { title: "Role" })).status).toBe(403)
    expect((await handleUpdateRecruiterJobRequest(candidate, jobId, { isActive: false })).status).toBe(403)
    expect((await handleDeleteRecruiterJobRequest(candidate, jobId)).status).toBe(403)
  })

  it("lists jobs for the signed-in recruiter", async () => {
    const list = jest.fn(async (userId: string) => {
      expect(userId).toBe(recruiter.id)
      return [mockJob()]
    })
    const response = await handleListRecruiterJobsRequest(recruiter, list)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { jobs: Job[] }
    expect(body.jobs[0]?.isPosted).toBe(true)
  })

  it("creates a job for a recruiter", async () => {
    const create = jest.fn(async () => mockJob())
    const response = await handleCreateRecruiterJobRequest(
      recruiter,
      { title: "Frontend Developer", requiredSkills: "JavaScript, React" },
      create
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(recruiter.id, expect.any(Object))
  })

  it("does not update another recruiter's job", async () => {
    const response = await handleUpdateRecruiterJobRequest(
      recruiter,
      jobId,
      { isActive: false },
      async () => {
        throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
      }
    )
    expect(response.status).toBe(404)
  })

  it("does not delete another recruiter's job", async () => {
    const response = await handleDeleteRecruiterJobRequest(recruiter, jobId, async () => {
      throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
    })
    expect(response.status).toBe(404)
  })

  it("allows an admin to use recruiter APIs", async () => {
    const response = await handleListRecruiterJobsRequest(
      { id: recruiter.id, role: "admin" },
      async () => [mockJob()]
    )
    expect(response.status).toBe(200)
  })
})
