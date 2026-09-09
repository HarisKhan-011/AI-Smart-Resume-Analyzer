import { describe, expect, it, jest } from "@jest/globals"
import {
  handleEvaluateInterviewAnswerRequest,
  handleGenerateInterviewPrepRequest,
} from "@/services/interview-prep/interview-prep-http"
import {
  evaluateInterviewAnswer,
  generateInterviewPrep,
  InterviewPrepError,
} from "@/services/interview-prep/interview-prep-service"
import { ChatLlmError } from "@/services/chat/chat-llm"
import type { Resume } from "@/types/resume"
import type { Job } from "@/types/job"
import type { InterviewQuestion } from "@/types/interview-prep"

const user = { id: "507f1f77bcf86cd799439012" }
const resumeId = "507f1f77bcf86cd799439011"
const jobId = "507f1f77bcf86cd799439033"

const sampleQuestion: InterviewQuestion = {
  id: "technical-0",
  category: "technical",
  difficulty: "easy",
  focus: "React",
  prompt: "What is React, and how does it show up on your resume?",
}

function mockResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: resumeId,
    userId: user.id,
    fileName: "cv.pdf",
    fileUrl: "local://resumes/cv.pdf",
    fileType: "pdf",
    extractedText: `Summary\nReact developer at Acme.\n\nExperience\nSoftware Engineer, Acme\n- Built dashboards with React\n\nProjects\nDashboard app\n\nSkills\nReact, JavaScript`,
    skills: ["React", "JavaScript"],
    extractedSkills: [],
    experience: [{ company: "Acme", position: "Software Engineer", startDate: "2022" }],
    education: [],
    analysisStatus: "completed",
    atsScore: 70,
    atsIssues: [],
    atsSuggestions: [],
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

describe("interview prep API", () => {
  it("rejects unauthenticated generate requests", async () => {
    const response = await handleGenerateInterviewPrepRequest(null, { resumeId })
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated evaluate requests", async () => {
    const response = await handleEvaluateInterviewAnswerRequest(null, {
      resumeId,
      question: sampleQuestion,
      answer: "I used React at Acme.",
    })
    expect(response.status).toBe(401)
  })

  it("returns 404 when the resume is not owned", async () => {
    const generate = jest.fn(async () => {
      throw new InterviewPrepError("Resume not found.", 404, "NOT_FOUND")
    })
    const response = await handleGenerateInterviewPrepRequest(user, { resumeId }, generate)
    expect(response.status).toBe(404)
  })

  it("returns 400 when the question payload is invalid", async () => {
    const response = await handleEvaluateInterviewAnswerRequest(user, {
      resumeId,
      question: { id: "x" },
      answer: "hello",
    })
    expect(response.status).toBe(400)
  })
})

describe("interview prep service", () => {
  it("generates grounded questions and keeps LLM ids from the resume set", async () => {
    const result = await generateInterviewPrep(user.id, resumeId, jobId, {
      getOwnedResume: jest.fn(async () => mockResume()),
      getAccessibleJob: jest.fn(async () => mockJob()),
      completeChat: jest.fn(async (messages: Array<{ content: string }>) => {
        const payload = JSON.parse(messages[1]?.content ?? "{}") as {
          questions?: Array<{ id?: string }>
        }
        const firstId = payload.questions?.[0]?.id ?? "missing"
        return JSON.stringify({
          questions: [
            { id: firstId, prompt: "How did you use React on your resume?" },
            { id: "invented-skill", prompt: "Tell me about Kubernetes at Google." },
          ],
        })
      }),
    })

    expect(result.usedLlm).toBe(true)
    expect(result.questions.some((question) => /React/.test(question.prompt))).toBe(true)
    expect(result.questions.every((question) => question.id !== "invented-skill")).toBe(true)
    expect(result.questions.map((question) => question.prompt).join(" ")).not.toMatch(/Google/)
    expect(result.job?.title).toBe("Frontend Developer")
  })

  it("falls back to grounded questions when the LLM key is missing", async () => {
    const result = await generateInterviewPrep(user.id, resumeId, undefined, {
      getOwnedResume: jest.fn(async () => mockResume()),
      getAccessibleJob: jest.fn(async () => null),
      completeChat: jest.fn(async () => {
        throw new ChatLlmError("Career assistant is not configured.", 503, "LLM_NOT_CONFIGURED")
      }),
    })

    expect(result.usedLlm).toBe(false)
    expect(result.questions.length).toBeGreaterThan(0)
    expect(result.questions.some((question) => /React/.test(question.prompt))).toBe(true)
    expect(result.notes.some((note) => /unavailable/i.test(note))).toBe(true)
  })

  it("evaluates an answer with local fallback when the LLM is unavailable", async () => {
    const evaluation = await evaluateInterviewAnswer(
      user.id,
      {
        resumeId,
        question: sampleQuestion,
        answer: "I built dashboards with React at Acme because I implemented the customer UI.",
      },
      {
        getOwnedResume: jest.fn(async () => mockResume()),
        getAccessibleJob: jest.fn(async () => null),
        completeChat: jest.fn(async () => {
          throw new ChatLlmError("Career assistant is not configured.", 503, "LLM_NOT_CONFIGURED")
        }),
      }
    )

    expect(evaluation.questionId).toBe("technical-0")
    expect(evaluation.score).toBeGreaterThan(0)
    expect(evaluation.strengths.join(" ")).toMatch(/React/)
  })
})
