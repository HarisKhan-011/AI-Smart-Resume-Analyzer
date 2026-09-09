import { describe, expect, it } from "@jest/globals"
import { adviseFromCareerContext } from "@/services/chat/chat-local-advisor"
import type { CareerChatContext } from "@/types/chat"

const context: CareerChatContext = {
  missingDataNotes: [],
  user: { name: "Jane", role: "candidate" },
  resume: {
    id: "507f1f77bcf86cd799439011",
    fileName: "cv.pdf",
    analysisStatus: "completed",
    skills: ["JavaScript", "React"],
    atsScore: 78,
    atsBreakdown: null,
    atsIssues: ["Experience bullets are limited or missing."],
    atsSuggestions: ["Add measurable results to experience bullets."],
    atsStrengths: ["Contact details are present and ATS-readable."],
    atsAnalysisStatus: "completed",
    experience: [{ position: "Frontend Developer", company: "Acme" }],
    education: [],
    resumeExcerpt: "Jane Candidate built React apps.",
  },
  jobMatches: [
    {
      jobTitle: "Frontend Developer",
      company: "Acme Inc",
      overallScore: 72,
      skillScore: 68,
      matchedSkills: ["React"],
      missingSkills: ["TypeScript"],
    },
  ],
  skillGaps: {
    missingSkills: ["TypeScript"],
    learningSuggestions: [{ skill: "TypeScript", suggestion: "Learn TypeScript fundamentals" }],
  },
  applications: [
    {
      status: "applied",
      jobTitle: "Frontend Developer",
      company: "Acme Inc",
      matchScore: 72,
      notes: "Waiting to hear back",
    },
  ],
  recommendedJobs: [],
}

describe("career chat local advisor", () => {
  it("answers ATS questions from the stored score only", () => {
    const reply = adviseFromCareerContext(context, "How ATS-friendly is my current resume?")
    expect(reply).toContain("78/100")
    expect(reply).toContain("cv.pdf")
    expect(reply).not.toMatch(/Google|invented/i)
  })

  it("answers application questions from tracked applications only", () => {
    const reply = adviseFromCareerContext(context, "What should I do with my applications?")
    expect(reply).toContain("Frontend Developer at Acme Inc")
    expect(reply).toContain("applied")
    expect(reply).toContain("Waiting to hear back")
  })

  it("does not invent a resume when none exists", () => {
    const reply = adviseFromCareerContext(
      {
        ...context,
        resume: null,
        missingDataNotes: ["The user has not uploaded a resume."],
        applications: [],
        jobMatches: [],
        skillGaps: { missingSkills: [], learningSuggestions: [] },
      },
      "How ATS-friendly is my current resume?"
    )
    expect(reply).toMatch(/do not have a resume/i)
    expect(reply).toContain("The user has not uploaded a resume.")
  })
})
