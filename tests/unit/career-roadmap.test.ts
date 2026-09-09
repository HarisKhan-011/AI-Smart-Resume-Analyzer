import { describe, expect, it, jest } from "@jest/globals"
import { buildCareerRoadmap } from "@/services/career-roadmap/build-roadmap"
import { generateCareerRoadmap } from "@/services/career-roadmap/career-roadmap-service"
import { handleCareerRoadmapRequest } from "@/services/career-roadmap/career-roadmap-http"
import { MatchingError } from "@/services/matching/run-match"
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
    extractedText: "React developer at Acme.",
    skills: ["React", "JavaScript"],
    extractedSkills: [],
    experience: [{ company: "Acme", position: "Frontend Developer", startDate: "2022" }],
    education: [],
    analysisStatus: "completed",
    atsScore: 78,
    atsSuggestions: ["Add measurable results to experience bullets."],
    atsIssues: [],
    atsStrengths: [],
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
    company: "Globex",
    location: "Remote",
    description: "Build interfaces with React.",
    requiredSkills: ["React", "Kubernetes"],
    preferredSkills: ["TypeScript"],
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

describe("career roadmap builder", () => {
  it("maps current skills to missing skills without inventing experience", () => {
    const result = buildCareerRoadmap({
      resume: mockResume(),
      job: mockJob(),
      matchScore: 64,
    })

    expect(result.currentSkills).toEqual(["React"])
    expect(result.missingSkills).toEqual(["Kubernetes"])
    expect(result.preferredMissingSkills).toEqual(["TypeScript"])
    expect(result.experience.join(" ")).toMatch(/Acme/)
    expect(result.stages.find((stage) => stage.level === "beginner")?.steps.map((step) => step.skill)).toEqual([
      "Kubernetes",
    ])
    expect(result.stages.find((stage) => stage.level === "advanced")?.steps.map((step) => step.skill)).toEqual([
      "TypeScript",
    ])
    const allSkills = result.stages.flatMap((stage) => stage.steps.map((step) => step.skill)).join(" ")
    expect(allSkills).not.toMatch(/Python|Google/)
    expect(result.matchScore).toBe(64)
    expect(result.notes.join(" ")).toMatch(/ATS notes/)
  })
})

describe("career roadmap API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await handleCareerRoadmapRequest(null, { resumeId, jobId })
    expect(response.status).toBe(401)
  })

  it("returns 404 when the resume is not owned", async () => {
    const generate = jest.fn(async () => {
      throw new MatchingError("Resume not found.", 404, "RESUME_NOT_FOUND")
    })
    const response = await handleCareerRoadmapRequest(user, { resumeId, jobId }, generate)
    expect(response.status).toBe(404)
  })
})

describe("career roadmap service", () => {
  it("uses the owned resume and accessible job", async () => {
    const result = await generateCareerRoadmap(user.id, resumeId, jobId, {
      getOwnedResume: jest.fn(async () => mockResume()),
      getAccessibleJob: jest.fn(async () => mockJob()),
      getMatchByResumeAndJob: jest.fn(async () => null),
    })

    expect(result.target.title).toBe("Frontend Developer")
    expect(result.currentSkills).toContain("React")
    expect(result.missingSkills).toContain("Kubernetes")
  })
})
