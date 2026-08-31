import { describe, expect, it } from "@jest/globals"
import { handleGetRecommendationsRequest } from "@/services/recommendations/recommendation-http"
import {
  experienceCompatibilityScore,
  rankJobRecommendations,
  recommendJobsForUser,
  RecommendationError,
  scoreJobRecommendation,
  yearsFromText,
} from "@/services/recommendations/recommendation-service"
import type { Job } from "@/types/job"
import type { Resume } from "@/types/resume"

const userId = "507f1f77bcf86cd799439012"
const resumeId = "507f1f77bcf86cd799439011"

function mockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "507f1f77bcf86cd799439033",
    title: "Frontend Developer",
    company: "Acme Inc",
    location: "Remote",
    description: "Build interfaces with JavaScript and React.",
    requiredSkills: ["JavaScript", "React", "CSS", "HTML"],
    preferredSkills: ["TypeScript"],
    employmentType: "full-time",
    source: "api",
    sourceUrl: "https://remotive.com/remote-jobs/software-dev/1",
    postedDate: new Date("2026-08-31"),
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    createdBy: null,
    ...overrides,
  }
}

function mockResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: resumeId,
    userId,
    fileName: "cv.pdf",
    fileUrl: "local://resumes/cv.pdf",
    fileType: "pdf",
    extractedText: "Software Engineer with 5 years of experience in JavaScript and React.",
    skills: ["JavaScript", "React", "Node.js", "CSS", "HTML"],
    extractedSkills: [],
    experience: [{ company: "Acme", position: "Frontend Developer", startDate: "2020" }],
    education: [],
    analysisStatus: "completed",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

describe("recommendation scoring", () => {
  it("parses years of experience from text", () => {
    expect(yearsFromText("5 years of experience with React")).toBe(5)
    expect(yearsFromText("No timeline listed")).toBeNull()
  })

  it("scores experience higher when years meet the job requirement", () => {
    const enough = experienceCompatibilityScore({
      resumeText: "7 years of experience",
      jobTitle: "React Developer",
      jobDescription: "Requires 3 years of experience with React",
      requiredSkills: ["React"],
      experience: [{ company: "Acme", position: "React Developer", startDate: "2018" }],
    })
    const short = experienceCompatibilityScore({
      resumeText: "1 years of experience",
      jobTitle: "Java Engineer",
      jobDescription: "Requires 8 years of experience with Java",
      requiredSkills: ["Java"],
      experience: [{ company: "Acme", position: "Support", startDate: "2025" }],
    })
    expect(enough).toBeGreaterThan(short)
  })

  it("ranks jobs from highest to lowest score", () => {
    const resume = mockResume()
    const ranked = rankJobRecommendations(resume, [
      mockJob({
        id: "1",
        title: "React Developer",
        requiredSkills: ["JavaScript", "React"],
        preferredSkills: ["CSS"],
      }),
      mockJob({
        id: "2",
        title: "Full Stack Developer",
        requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
        preferredSkills: [],
      }),
      mockJob({
        id: "3",
        title: "Frontend Developer",
        requiredSkills: ["JavaScript", "React", "CSS", "HTML"],
        preferredSkills: ["TypeScript"],
      }),
    ])

    expect(ranked.map((item) => item.job.title)).toEqual([
      "React Developer",
      "Frontend Developer",
      "Full Stack Developer",
    ])
    expect(ranked[0]?.overallScore).toBeGreaterThanOrEqual(ranked[1]?.overallScore ?? 0)
    expect(ranked[1]?.overallScore).toBeGreaterThanOrEqual(ranked[2]?.overallScore ?? 0)
  })

  it("does not recommend jobs with almost no overlapping skills", () => {
    const result = scoreJobRecommendation({
      resumeId,
      resumeSkills: ["JavaScript", "React"],
      job: mockJob({
        title: "Java Engineer",
        requiredSkills: ["Java", "Spring", "Kubernetes", "Kafka", "SQL", "AWS", "Docker", "Go"],
        preferredSkills: [],
      }),
    })
    expect(result).toBeNull()
  })

  it("skips jobs with no required skills", () => {
    const result = scoreJobRecommendation({
      resumeId,
      resumeSkills: ["JavaScript"],
      job: mockJob({ requiredSkills: [], preferredSkills: [] }),
    })
    expect(result).toBeNull()
  })

  it("returns at most 10 jobs", () => {
    const resume = mockResume()
    const jobs = Array.from({ length: 12 }, (_, index) =>
      mockJob({
        id: String(index + 1),
        title: `React Developer ${index + 1}`,
        requiredSkills: ["JavaScript", "React"],
        preferredSkills: [],
      })
    )
    expect(rankJobRecommendations(resume, jobs)).toHaveLength(10)
  })

  it("ranks a stronger preferred-skill match higher when required coverage is equal", () => {
    const resume = mockResume({ skills: ["JavaScript", "React", "TypeScript"] })
    const ranked = rankJobRecommendations(resume, [
      mockJob({
        id: "a",
        title: "React Developer A",
        requiredSkills: ["JavaScript", "React"],
        preferredSkills: ["Go"],
      }),
      mockJob({
        id: "b",
        title: "React Developer B",
        requiredSkills: ["JavaScript", "React"],
        preferredSkills: ["TypeScript"],
      }),
    ])
    expect(ranked[0]?.job.title).toBe("React Developer B")
  })
})

describe("recommendJobsForUser", () => {
  it("rejects a resume with no extracted skills", async () => {
    await expect(
      recommendJobsForUser(userId, resumeId, {
        getOwnedResume: async () => mockResume({ skills: [] }),
        listResumesByUser: async () => [],
        listJobsForRecommendations: async () => [],
      })
    ).rejects.toMatchObject({ code: "RESUME_NOT_ANALYZED", status: 400 })
  })

  it("uses the requested resume and returns ranked jobs", async () => {
    const result = await recommendJobsForUser(userId, resumeId, {
      getOwnedResume: async () => mockResume(),
      listResumesByUser: async () => [],
      listJobsForRecommendations: async () => [
        mockJob({ id: "1", title: "React Developer", requiredSkills: ["JavaScript", "React"] }),
        mockJob({
          id: "2",
          title: "Java Engineer",
          requiredSkills: ["Java", "Spring", "Kafka"],
        }),
      ],
    })
    expect(result.resume.id).toBe(resumeId)
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations.every((item) => item.matchedSkills.length > 0)).toBe(true)
  })
})

describe("recommendations API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await handleGetRecommendationsRequest(null)
    expect(response.status).toBe(401)
  })

  it("returns ranked recommendations", async () => {
    const response = await handleGetRecommendationsRequest({ id: userId }, resumeId, async () => ({
      resume: {
        id: resumeId,
        fileName: "cv.pdf",
        analysisStatus: "completed" as const,
        skillCount: 5,
      },
      recommendations: [
        {
          jobId: "1",
          resumeId,
          overallScore: 92,
          skillScore: 100,
          preferredScore: 100,
          experienceScore: 75,
          relevanceScore: 100,
          matchedSkills: ["JavaScript", "React"],
          missingSkills: [],
          preferredMatchedSkills: ["CSS"],
          job: {
            id: "1",
            title: "Frontend Developer",
            company: "Acme",
            location: "Remote",
            employmentType: "full-time",
            source: "api",
            sourceUrl: null,
          },
        },
      ],
    }))
    expect(response.status).toBe(200)
    const body = (await response.json()) as { recommendations: { overallScore: number }[] }
    expect(body.recommendations[0]?.overallScore).toBe(92)
  })

  it("maps recommendation errors to HTTP status codes", async () => {
    const response = await handleGetRecommendationsRequest({ id: userId }, resumeId, async () => {
      throw new RecommendationError("Resume not found.", 404, "RESUME_NOT_FOUND")
    })
    expect(response.status).toBe(404)
  })
})
