import { describe, expect, it, jest } from "@jest/globals"
import { handleAnalyzeResumeRequest } from "@/services/resume-http"
import { analyzeOwnedResume, ResumeAnalysisError } from "@/services/resume-analysis-service"
import type { ExtractedSkill, Resume } from "@/types/resume"

const ownerId = "507f1f77bcf86cd799439012"
const resumeId = "507f1f77bcf86cd799439011"

const owner = { id: ownerId, name: "Owner", email: "owner@example.com" }

const extractedSkills: ExtractedSkill[] = [
  { name: "JavaScript", category: "Programming Languages", confidence: 0.95 },
  { name: "React", category: "Web Development", confidence: 0.95 },
]

function mockResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: resumeId,
    userId: ownerId,
    fileName: "cv.pdf",
    fileUrl: "local://resumes/owner/cv.pdf",
    fileType: "pdf",
    extractedText: "Built apps with JavaScript and React.",
    skills: [],
    extractedSkills: [],
    experience: [],
    education: [],
    analysisStatus: "pending",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

describe("resume analysis", () => {
  it("rejects unauthenticated analysis", async () => {
    const response = await handleAnalyzeResumeRequest(null, resumeId)
    expect(response.status).toBe(401)
  })

  it("returns 404 when another user tries to analyze a resume", async () => {
    const analyze = jest.fn(async () => {
      throw new ResumeAnalysisError("Resume not found.", 404, "NOT_FOUND")
    })

    const response = await handleAnalyzeResumeRequest(owner, resumeId, analyze)
    expect(response.status).toBe(404)
  })

  it("extracts skills, saves them, and marks analysis completed", async () => {
    const getOwnedResume = jest.fn(async () => mockResume())
    const updateOwnedResume = jest.fn(async (_id: string, _userId: string, input: Partial<Resume>) =>
      mockResume({
        skills: extractedSkills.map((skill) => skill.name),
        extractedSkills,
        analysisStatus: (input.analysisStatus as Resume["analysisStatus"]) ?? "completed",
      })
    )
    const extractSkills = jest.fn(() => extractedSkills)

    const result = await analyzeOwnedResume(resumeId, ownerId, {
      getOwnedResume,
      updateOwnedResume,
      extractSkills,
    })

    expect(extractSkills).toHaveBeenCalledWith("Built apps with JavaScript and React.")
    expect(updateOwnedResume).toHaveBeenCalledWith(
      resumeId,
      ownerId,
      expect.objectContaining({
        skills: ["JavaScript", "React"],
        extractedSkills,
        analysisStatus: "completed",
      })
    )
    expect(result.skillCount).toBe(2)
    expect(result.resume.analysisStatus).toBe("completed")
  })
})
