import { describe, expect, it, jest } from "@jest/globals"
import { buildCareerChatContext } from "@/services/chat/chat-context"
import type { Resume } from "@/types/resume"
import type { Match } from "@/types/matching"
import type { ApplicationWithJob } from "@/services/applications/application-service"
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
    extractedText: "Jane Candidate built React apps at Acme.",
    skills: ["JavaScript", "React"],
    extractedSkills: [],
    experience: [{ company: "Acme", position: "Frontend Developer", startDate: "2022" }],
    education: [{ institution: "State University", degree: "B.S.", field: "CS", graduationYear: "2020" }],
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
    atsIssues: ["Experience bullets are limited or missing."],
    atsSuggestions: ["Add measurable results to experience bullets."],
    atsStrengths: ["Contact details are present and ATS-readable."],
    atsAnalysisStatus: "completed",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

describe("career chat context", () => {
  it("assembles resume, ATS, matches, skill gaps, and applications without inventing jobs", async () => {
    const resume = mockResume()
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
    const application: ApplicationWithJob = {
      id: "507f1f77bcf86cd799439055",
      userId,
      jobId,
      status: "applied",
      appliedAt: new Date("2026-09-01"),
      notes: "Waiting to hear back",
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
      job: {
        id: jobId,
        title: "Frontend Developer",
        company: "Acme Inc",
        location: "Remote",
        employmentType: "full-time",
      },
      matchScore: 72,
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
          missingSkills: ["TypeScript"],
          preferredMatchedSkills: [],
          job: {
            id: jobId,
            title: "Frontend Developer",
            company: "Acme Inc",
            location: "Remote",
            employmentType: "full-time",
            source: "api",
          },
        },
      ],
    }

    const context = await buildCareerChatContext(
      userId,
      { name: "Jane", role: "candidate" },
      {
        listResumesByUser: jest.fn(async () => [resume]),
        getOwnedResume: jest.fn(async () => resume),
        listMatchesByUser: jest.fn(async () => [match]),
        listOwnedApplicationsWithJobs: jest.fn(async () => [application]),
        recommendJobsForUser: jest.fn(async () => recommendations),
        loadJobLabels: jest.fn(async () => new Map([[jobId, { title: "Frontend Developer", company: "Acme Inc" }]])),
      }
    )

    expect(context.resume?.atsScore).toBe(78)
    expect(context.resume?.skills).toEqual(["JavaScript", "React"])
    expect(context.jobMatches[0]).toMatchObject({
      jobTitle: "Frontend Developer",
      overallScore: 72,
      missingSkills: ["TypeScript"],
    })
    expect(context.applications[0]).toMatchObject({
      status: "applied",
      jobTitle: "Frontend Developer",
      notes: "Waiting to hear back",
    })
    expect(context.skillGaps.missingSkills).toContain("TypeScript")
    expect(context.recommendedJobs[0].title).toBe("Frontend Developer")
    expect(JSON.stringify(context)).not.toMatch(/Google|Netflix|invented/i)
  })

  it("records missing-data notes instead of fabricating a resume", async () => {
    const context = await buildCareerChatContext(
      userId,
      { name: "Jane", role: "candidate" },
      {
        listResumesByUser: jest.fn(async () => []),
        getOwnedResume: jest.fn(async () => null),
        listMatchesByUser: jest.fn(async () => []),
        listOwnedApplicationsWithJobs: jest.fn(async () => []),
        recommendJobsForUser: jest.fn(async () => {
          throw new Error("should not run")
        }),
        loadJobLabels: jest.fn(async () => new Map()),
      }
    )

    expect(context.resume).toBeNull()
    expect(context.jobMatches).toEqual([])
    expect(context.applications).toEqual([])
    expect(context.recommendedJobs).toEqual([])
    expect(context.missingDataNotes.some((note) => /has not uploaded a resume/i.test(note))).toBe(true)
  })
})
