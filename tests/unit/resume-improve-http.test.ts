import { describe, expect, it, jest } from "@jest/globals"
import { handleResumeImproveRequest } from "@/services/resume-improve/resume-improve-http"
import { improveOwnedResume, ResumeImproveError } from "@/services/resume-improve/resume-improve-service"
import { ChatLlmError } from "@/services/chat/chat-llm"
import type { Resume } from "@/types/resume"
import type { Job } from "@/types/job"

const user = { id: "507f1f77bcf86cd799439012" }
const resumeId = "507f1f77bcf86cd799439011"
const jobId = "507f1f77bcf86cd799439033"

function mockResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: resumeId,
    userId: user.id,
    fileName: "cv.pdf",
    fileUrl: "local://resumes/cv.pdf",
    fileType: "pdf",
    extractedText: `Summary\nReact developer at Acme.\n\nExperience\n- Built dashboards with React\n\nSkills\nReact, JavaScript`,
    skills: ["React", "JavaScript"],
    extractedSkills: [],
    experience: [{ company: "Acme", position: "Developer", startDate: "2022" }],
    education: [],
    analysisStatus: "completed",
    atsScore: 70,
    atsIssues: ["Experience bullets are limited or missing."],
    atsSuggestions: ["Start bullets with action verbs."],
    atsAnalysisStatus: "completed",
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
    description: "Build interfaces with React.",
    requiredSkills: ["React", "TypeScript"],
    preferredSkills: [],
    employmentType: "full-time",
    source: "api",
    sourceUrl: null,
    postedDate: new Date("2026-08-31"),
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    createdBy: null,
    ...overrides,
  }
}

describe("resume improve API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await handleResumeImproveRequest(null, { resumeId })
    expect(response.status).toBe(401)
  })

  it("returns 404 when the resume is not owned", async () => {
    const improve = jest.fn(async () => {
      throw new ResumeImproveError("Resume not found.", 404, "NOT_FOUND")
    })
    const response = await handleResumeImproveRequest(user, { resumeId }, improve)
    expect(response.status).toBe(404)
  })
})

describe("resume improve service", () => {
  it("returns original vs improved sections without using invented LLM skills", async () => {
    const result = await improveOwnedResume(user.id, resumeId, jobId, {
      getOwnedResume: jest.fn(async () => mockResume()),
      getAccessibleJob: jest.fn(async () => mockJob()),
      completeChat: jest.fn(async () =>
        JSON.stringify({
          summary: "React developer at Acme.",
          experience: "• Built dashboards with React",
          projects: "",
          skills: "React, Kubernetes",
          notes: ["Emphasized React because it already appears on the resume."],
        })
      ),
    })

    expect(result.originalUnchanged).toBe(true)
    expect(result.usedLlm).toBe(true)
    expect(result.sections).toHaveLength(4)
    const skills = result.sections.find((section) => section.key === "skills")
    expect(skills?.improved).toMatch(/React/)
    expect(skills?.improved).not.toMatch(/Kubernetes/)
    expect(result.job?.title).toBe("Frontend Developer")
  })

  it("falls back to rule-based rewrites when the LLM key is missing", async () => {
    const result = await improveOwnedResume(user.id, resumeId, undefined, {
      getOwnedResume: jest.fn(async () => mockResume()),
      getAccessibleJob: jest.fn(async () => null),
      completeChat: jest.fn(async () => {
        throw new ChatLlmError("Career assistant is not configured.", 503, "LLM_NOT_CONFIGURED")
      }),
    })

    expect(result.usedLlm).toBe(false)
    expect(result.sections.find((section) => section.key === "experience")?.improved).toMatch(/Built dashboards/)
    expect(result.notes.some((note) => /rule-based/i.test(note))).toBe(true)
  })
})
