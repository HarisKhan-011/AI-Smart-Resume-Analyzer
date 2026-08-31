import { describe, expect, it, jest } from "@jest/globals"
import { handleAnalyzeJobRequest } from "@/services/job-http"
import { analyzeJobDescription, JobAnalysisError } from "@/services/job-analysis-service"
import type { Job } from "@/types/job"
import type { ExtractedSkill } from "@/types/resume"

const userId = "507f1f77bcf86cd799439012"
const user = { id: userId, name: "Owner", email: "owner@example.com" }

const description = `
We need a developer with strong JavaScript and React experience.

Requirements:
JavaScript, React, Node.js, MongoDB

Preferred:
AWS, Docker
`

function mockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "507f1f77bcf86cd799439033",
    title: "Frontend Developer",
    company: "Acme Inc",
    location: "Remote",
    description,
    requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
    preferredSkills: ["AWS", "Docker"],
    employmentType: "full-time",
    source: "manual",
    sourceUrl: null,
    postedDate: new Date("2026-08-31"),
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    createdBy: userId,
    ...overrides,
  }
}

describe("job analysis API", () => {
  it("rejects unauthenticated analysis", async () => {
    const response = await handleAnalyzeJobRequest(null, {
      title: "Frontend Developer",
      company: "Acme Inc",
      description,
    })
    expect(response.status).toBe(401)
  })

  it("rejects an empty job description", async () => {
    const response = await handleAnalyzeJobRequest(user, {
      title: "Frontend Developer",
      company: "Acme Inc",
      description: "",
    })
    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: string }
    expect(body.error).toMatch(/empty|short/i)
  })

  it("rejects a very short job description", async () => {
    await expect(
      analyzeJobDescription(
        {
          title: "Engineer",
          company: "Acme Inc",
          description: "Too short to analyze skills here",
        },
        userId
      )
    ).rejects.toBeInstanceOf(JobAnalysisError)
  })

  it("saves extracted skills and skips creating a duplicate job", async () => {
    const extracted = {
      requiredSkills: ["JavaScript", "React"],
      preferredSkills: ["AWS"],
      detectedSkills: [
        { name: "JavaScript", category: "Programming Languages", confidence: 0.95 },
        { name: "React", category: "Web Development", confidence: 0.95 },
        { name: "AWS", category: "Cloud", confidence: 0.95 },
      ] satisfies ExtractedSkill[],
      technicalSkills: [],
      toolSkills: [],
    }

    const existing = mockJob()
    const findDuplicateJob = jest.fn(async () => existing)
    const updateJob = jest.fn(async () =>
      mockJob({
        requiredSkills: extracted.requiredSkills,
        preferredSkills: extracted.preferredSkills,
      })
    )
    const createJob = jest.fn(async () => mockJob())
    const extractJobSkills = jest.fn(() => extracted)

    const result = await analyzeJobDescription(
      {
        title: "Frontend Developer",
        company: "Acme Inc",
        location: "Remote",
        description,
      },
      userId,
      { extractJobSkills, createJob, updateJob, findDuplicateJob }
    )

    expect(createJob).not.toHaveBeenCalled()
    expect(updateJob).toHaveBeenCalled()
    expect(result.alreadyExists).toBe(true)
    expect(result.requiredSkills).toEqual(["JavaScript", "React"])
    expect(result.preferredSkills).toEqual(["AWS"])
  })
})
