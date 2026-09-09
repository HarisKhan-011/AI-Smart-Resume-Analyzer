import { describe, expect, it, jest } from "@jest/globals"
import { loadCareerIntelligence } from "@/services/dashboard/career-intelligence"
import { emptyApplicationCounts } from "@/services/applications/status"
import type { Resume } from "@/types/resume"
import type { Match } from "@/types/matching"
import type { RecommendJobsResult } from "@/services/recommendations/recommendation-service"

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
  it("uses Mongo-backed ATS, match, coverage, applications, and missing skills", async () => {
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
    const recommendations: RecommendJobsResult = {
      resume: { id: resumeId, fileName: "cv.pdf", analysisStatus: "completed", skillCount: 2 },
      recommendations: [
        {
          jobId,
          resumeId,
          overallScore: 70,
          skillScore: 65,
          preferredScore: 40,
          experienceScore: 50,
          relevanceScore: 60,
          matchedSkills: ["React"],
          missingSkills: ["GraphQL"],
          preferredMatchedSkills: [],
          job: {
            id: jobId,
            title: "Frontend Developer",
            company: "Acme Inc",
            location: "Remote",
            employmentType: "full-time",
            source: "api",
            sourceUrl: null,
          },
        },
      ],
    }

    const snapshot = await loadCareerIntelligence(userId, {
      listResumesByUser: jest.fn(async () => [mockResume()]),
      listMatchesByUser: jest.fn(async () => [match]),
      countOwnedApplicationsByStatus: jest.fn(async () => ({
        ...emptyApplicationCounts(),
        saved: 2,
        applied: 1,
        interview: 3,
      })),
      recommendJobsForUser: jest.fn(async () => recommendations),
      loadJobLabels: jest.fn(async () => new Map([[jobId, { title: "Frontend Developer", company: "Acme Inc" }]])),
    })

    expect(snapshot.atsScore).toBe(78)
    expect(snapshot.jobMatchScore).toBe(72)
    expect(snapshot.skillCoverage).toBe(68)
    expect(snapshot.missingSkills).toEqual(["TypeScript", "GraphQL"])
    expect(snapshot.currentSkills).toEqual(["JavaScript", "React"])
    expect(snapshot.applicationCounts.saved).toBe(2)
    expect(snapshot.applicationCounts.applied).toBe(1)
    expect(snapshot.applicationCounts.interview).toBe(3)
    expect(snapshot.recommendedJobs).toHaveLength(1)
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
      countOwnedApplicationsByStatus: jest.fn(async () => emptyApplicationCounts()),
      recommendJobsForUser: jest.fn(async () => ({
        resume: { id: resumeId, fileName: "cv.pdf", analysisStatus: "completed" as const, skillCount: 2 },
        recommendations: [],
      })),
      loadJobLabels: jest.fn(async () => new Map()),
    })

    expect(snapshot.atsScore).toBeNull()
    expect(snapshot.jobMatchScore).toBeNull()
    expect(snapshot.skillCoverage).toBeNull()
    expect(snapshot.missingSkills).toEqual([])
    expect(snapshot.applicationTotal).toBe(0)
  })
})
