import { describe, expect, it, jest } from "@jest/globals"
import { loadCareerIntelligence } from "@/services/dashboard/career-intelligence"
import type { Resume } from "@/types/resume"
import type { Match } from "@/types/matching"

const userId = "507f1f77bcf86cd799439012"
const resumeId = "507f1f77bcf86cd799439011"
const jobId = "507f1f77bcf86cd799439033"

function mockResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: resumeId,
    userId,
    fileName: "cv.pdf",
    fileUrl: "local://resumes/cv.pdf",
    fileType: "pdf",
    skills: ["JavaScript", "React"],
    extractedSkills: [],
    experience: [{ company: "Acme", position: "Frontend Developer", startDate: "2022" }],
    education: [],
    analysisStatus: "completed",
    atsScore: 78,
    atsBreakdown: {
      contact: 80,
      sections: 80,
      keywords: 70,
      readability: 85,
      experience: 75,
      completeness: 80,
    },
    atsIssues: [],
    atsSuggestions: ["Add measurable results to experience bullets."],
    atsStrengths: [],
    atsAnalysisStatus: "completed",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

describe("career intelligence dashboard data", () => {
  it("uses Mongo-backed ATS, match, coverage, and missing skills", async () => {
    const match: Match = {
      id: "507f1f77bcf86cd799439044",
      userId,
      resumeId,
      jobId,
      overallScore: 72,
      skillScore: 68,
      semanticScore: 60,
      experienceScore: 50,
      matchedSkills: ["React"],
      missingSkills: ["TypeScript"],
      createdAt: new Date("2026-08-31"),
    }

    const snapshot = await loadCareerIntelligence(userId, {
      listResumesByUser: jest.fn(async () => [mockResume()]),
      listMatchesByUser: jest.fn(async () => [match]),
      loadJobLabels: jest.fn(async () => new Map([[jobId, { title: "Frontend Developer", company: "Acme Inc" }]])),
    })

    expect(snapshot.atsScore).toBe(78)
    expect(snapshot.jobMatchScore).toBe(72)
    expect(snapshot.skillCoverage).toBe(68)
    expect(snapshot.missingSkills).toEqual(["TypeScript"])
    expect(snapshot.currentSkills).toEqual(["JavaScript", "React"])
    expect(snapshot.recommendedJobs).toEqual([])
    expect(snapshot.persistedMatches[0]?.jobTitle).toBe("Frontend Developer")
  })

  it("does not invent ATS or match scores when that data is missing", async () => {
    const snapshot = await loadCareerIntelligence(userId, {
      listResumesByUser: jest.fn(async () => [
        mockResume({
          atsScore: null,
          atsBreakdown: null,
          atsAnalysisStatus: "pending",
        }),
      ]),
      listMatchesByUser: jest.fn(async () => []),
      loadJobLabels: jest.fn(async () => new Map()),
    })

    expect(snapshot.atsScore).toBeNull()
    expect(snapshot.jobMatchScore).toBeNull()
    expect(snapshot.skillCoverage).toBeNull()
    expect(snapshot.missingSkills).toEqual([])
    expect(snapshot.applicationTotal).toBe(0)
  })
})
