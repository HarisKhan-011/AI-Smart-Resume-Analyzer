import { describe, expect, it, jest } from "@jest/globals"
import { handleCreateMatchRequest, handleGetMatchRequest } from "@/services/matching-http"
import { matchOwnedResumeToJob, MatchingError } from "@/services/matching/run-match"
import type { Match } from "@/types/matching"
import type { Resume } from "@/types/resume"
import type { Job } from "@/types/job"

const userId = "507f1f77bcf86cd799439012"
const resumeId = "507f1f77bcf86cd799439011"
const jobId = "507f1f77bcf86cd799439033"
const user = { id: userId }

function mockResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: resumeId,
    userId,
    fileName: "cv.pdf",
    fileUrl: "local://resumes/cv.pdf",
    fileType: "pdf",
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    extractedSkills: [],
    experience: [],
    education: [],
    analysisStatus: "completed",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

function mockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: jobId,
    title: "Frontend Developer",
    company: "Acme Inc",
    location: "Remote",
    description: "Build web apps",
    requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
    preferredSkills: [],
    employmentType: "full-time",
    source: "manual",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    postedDate: new Date("2026-08-31"),
    createdBy: userId,
    ...overrides,
  }
}

function mockMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "507f1f77bcf86cd799439044",
    userId,
    resumeId,
    jobId,
    overallScore: 67,
    skillScore: 67,
    experienceScore: 0,
    matchedSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
    missingSkills: ["AWS", "Docker"],
    createdAt: new Date("2026-08-31"),
    ...overrides,
  }
}

describe("matching API", () => {
  it("rejects unauthenticated match requests", async () => {
    const response = await handleCreateMatchRequest(null, { resumeId, jobId })
    expect(response.status).toBe(401)
  })

  it("returns 404 when the resume belongs to another user", async () => {
    const response = await handleCreateMatchRequest(
      user,
      { resumeId, jobId },
      {
        matchOwnedResumeToJob: jest.fn(async () => {
          throw new MatchingError("Resume not found.", 404, "RESUME_NOT_FOUND")
        }),
      }
    )
    expect(response.status).toBe(404)
  })

  it("saves a skill match result", async () => {
    const comparison = {
      overallScore: 67,
      skillScore: 67,
      experienceScore: 0,
      educationScore: 0,
      matchedSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      missingSkills: ["AWS", "Docker"],
      preferredMatchedSkills: [],
      preferredMissingSkills: [],
    }
    const run = jest.fn(async () => ({
      match: mockMatch(),
      comparison,
      resume: { id: resumeId, fileName: "cv.pdf", analysisStatus: "completed" as const },
      job: {
        id: jobId,
        title: "Frontend Developer",
        company: "Acme Inc",
        location: "Remote",
        requiredSkills: mockJob().requiredSkills,
        preferredSkills: [],
      },
    }))

    const response = await handleCreateMatchRequest(user, { resumeId, jobId }, {
      matchOwnedResumeToJob: run,
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { overallScore: number; missingSkills: string[] }
    expect(body.overallScore).toBe(67)
    expect(body.missingSkills).toEqual(["AWS", "Docker"])
  })

  it("does not return another user's match via GET", async () => {
    const response = await handleGetMatchRequest(user, resumeId, jobId, {
      getOwnedResume: jest.fn(async () => null),
      getOwnedJob: jest.fn(async () => mockJob()),
      getMatchByResumeAndJob: jest.fn(async () => mockMatch()),
    })
    expect(response.status).toBe(404)
  })
})

describe("matchOwnedResumeToJob", () => {
  it("compares owned resume and job skills and persists the match", async () => {
    const saveMatch = jest.fn(async () => mockMatch())
    const result = await matchOwnedResumeToJob(userId, resumeId, jobId, {
      getOwnedResume: jest.fn(async () => mockResume()),
      getOwnedJob: jest.fn(async () => mockJob()),
      calculateMatch: jest.fn(() => ({
        overallScore: 67,
        skillScore: 67,
        experienceScore: 0,
        educationScore: 0,
        matchedSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
        missingSkills: ["AWS", "Docker"],
        preferredMatchedSkills: [],
        preferredMissingSkills: [],
      })),
      saveMatch,
    })

    expect(saveMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        resumeId,
        jobId,
        overallScore: 67,
        matchedSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      })
    )
    expect(result.match.overallScore).toBe(67)
  })
})
