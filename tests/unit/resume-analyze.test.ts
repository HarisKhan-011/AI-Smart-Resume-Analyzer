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

  it("saves ATS results after skill extraction", async () => {
    const ats = {
      score: 81,
      overallStatus: "strong" as const,
      breakdown: {
        contact: 80,
        sections: 85,
        keywords: 75,
        readability: 90,
        experience: 70,
        completeness: 80,
      },
      issues: [],
      suggestions: ["Add more metrics to experience bullets."],
      strengths: ["Contact details are present and ATS-readable."],
    }
    const getOwnedResume = jest.fn(async () => mockResume())
    const updateOwnedResume = jest.fn(async (_id: string, _userId: string, input: Partial<Resume>) =>
      mockResume({
        skills: extractedSkills.map((skill) => skill.name),
        extractedSkills,
        analysisStatus: (input.analysisStatus as Resume["analysisStatus"]) ?? "completed",
        atsScore: input.atsScore,
        atsBreakdown: input.atsBreakdown,
        atsIssues: input.atsIssues,
        atsSuggestions: input.atsSuggestions,
        atsStrengths: input.atsStrengths,
        atsAnalysisStatus: input.atsAnalysisStatus,
      })
    )
    const extractSkills = jest.fn(() => extractedSkills)
    const analyzeAts = jest.fn(() => ats)

    const result = await analyzeOwnedResume(resumeId, ownerId, {
      getOwnedResume,
      updateOwnedResume,
      extractSkills,
      analyzeAts,
    })

    expect(analyzeAts).toHaveBeenCalledWith({
      text: "Built apps with JavaScript and React.",
      skills: extractedSkills,
    })
    expect(updateOwnedResume).toHaveBeenCalledWith(
      resumeId,
      ownerId,
      expect.objectContaining({
        skills: ["JavaScript", "React"],
        analysisStatus: "completed",
        atsScore: 81,
        atsBreakdown: ats.breakdown,
        atsIssues: [],
        atsSuggestions: ats.suggestions,
        atsStrengths: ats.strengths,
        atsAnalysisStatus: "completed",
      })
    )
    expect(result.ats?.score).toBe(81)
    expect(result.resume.atsAnalysisStatus).toBe("completed")
  })

  it("keeps skill analysis completed when ATS analysis throws", async () => {
    const getOwnedResume = jest.fn(async () => mockResume())
    const updateOwnedResume = jest.fn(async (_id: string, _userId: string, input: Partial<Resume>) =>
      mockResume({
        skills: extractedSkills.map((skill) => skill.name),
        extractedSkills,
        analysisStatus: (input.analysisStatus as Resume["analysisStatus"]) ?? "completed",
        atsAnalysisStatus: input.atsAnalysisStatus,
      })
    )
    const extractSkills = jest.fn(() => extractedSkills)
    const analyzeAts = jest.fn(() => {
      throw new Error("ats crashed")
    })

    const result = await analyzeOwnedResume(resumeId, ownerId, {
      getOwnedResume,
      updateOwnedResume,
      extractSkills,
      analyzeAts,
    })

    expect(updateOwnedResume).toHaveBeenCalledWith(
      resumeId,
      ownerId,
      expect.objectContaining({
        skills: ["JavaScript", "React"],
        extractedSkills,
        analysisStatus: "completed",
        atsAnalysisStatus: "failed",
      })
    )
    expect(result.resume.analysisStatus).toBe("completed")
    expect(result.ats).toBeNull()
  })
})
