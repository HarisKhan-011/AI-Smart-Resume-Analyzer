import { getOwnedResume } from "@/services/resume-service"
import { getAccessibleJob } from "@/services/job-service"
import { completeChat, ChatLlmError, getChatLlmConfig, type ChatLlmMessage } from "@/services/chat/chat-llm"
import { extractResumeSections } from "@/services/resume-improve/extract-resume-sections"
import { buildGroundedInterviewQuestions } from "@/services/interview-prep/build-questions"
import { evaluateAnswerLocally } from "@/services/interview-prep/evaluate-answer"
import type {
  InterviewEvaluation,
  InterviewPrepResult,
  InterviewQuestion,
} from "@/types/interview-prep"
import type { Job } from "@/types/job"
import type { Resume } from "@/types/resume"

export class InterviewPrepError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "INTERVIEW_PREP_ERROR") {
    super(message)
    this.name = "InterviewPrepError"
    this.status = status
    this.code = code
  }
}

function truncate(text: string, max: number): string {
  const value = text.trim()
  if (value.length <= max) return value
  return `${value.slice(0, max).trimEnd()}…`
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const fenced = raw.match(/\{[\s\S]*\}/)
  const payload = fenced?.[0] ?? raw
  try {
    const parsed = JSON.parse(payload) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function parseQuestions(raw: string, fallback: InterviewQuestion[]): InterviewQuestion[] {
  const parsed = parseJsonObject(raw)
  const list = parsed?.questions
  if (!Array.isArray(list) || list.length === 0) return fallback

  const prompts = new Map<string, string>()
  const allowed = new Set(fallback.map((item) => item.id))
  for (const item of list) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const id = typeof row.id === "string" ? row.id : ""
    const prompt = typeof row.prompt === "string" ? row.prompt.trim() : ""
    if (!allowed.has(id) || !prompt) continue
    prompts.set(id, prompt)
  }
  if (!prompts.size) return fallback
  return fallback.map((item) => {
    const prompt = prompts.get(item.id)
    return prompt ? { ...item, prompt } : item
  })
}

function parseEvaluation(raw: string, fallback: InterviewEvaluation): InterviewEvaluation {
  const parsed = parseJsonObject(raw)
  if (!parsed) return fallback
  const score = typeof parsed.score === "number" ? parsed.score : fallback.score
  const asStrings = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []
  return {
    questionId: fallback.questionId,
    score: Math.max(0, Math.min(100, Math.round(score))),
    strengths: asStrings(parsed.strengths).slice(0, 5),
    weaknesses: asStrings(parsed.weaknesses).slice(0, 5),
    suggestions: asStrings(parsed.suggestions).slice(0, 5),
    feedback: typeof parsed.feedback === "string" && parsed.feedback.trim() ? parsed.feedback.trim() : fallback.feedback,
  }
}

async function loadResumeContext(userId: string, resumeId: string, jobId: string | undefined, deps: InterviewPrepDependencies) {
  const id = resumeId.trim()
  if (!id) {
    throw new InterviewPrepError("A resume is required.", 400, "RESUME_REQUIRED")
  }
  const resume = await deps.getOwnedResume(id, userId)
  if (!resume) {
    throw new InterviewPrepError("Resume not found.", 404, "NOT_FOUND")
  }
  const extractedText = resume.extractedText?.trim() ?? ""
  if (!extractedText) {
    throw new InterviewPrepError("This resume has no extracted text to use for interview prep.", 400, "NO_TEXT")
  }

  let job: Job | null = null
  const targetJobId = jobId?.trim() ?? ""
  if (targetJobId) {
    job = await deps.getAccessibleJob(targetJobId, userId)
    if (!job) {
      throw new InterviewPrepError("Job not found.", 404, "JOB_NOT_FOUND")
    }
  }

  const sections = extractResumeSections(extractedText, resume)
  return { resume, job, sections, extractedText }
}

type InterviewPrepDependencies = {
  getOwnedResume: typeof getOwnedResume
  getAccessibleJob: typeof getAccessibleJob
  completeChat: typeof completeChat
}

const defaultDependencies: InterviewPrepDependencies = {
  getOwnedResume,
  getAccessibleJob,
  completeChat,
}

export async function generateInterviewPrep(
  userId: string,
  resumeId: string,
  jobId?: string,
  deps: InterviewPrepDependencies = defaultDependencies
): Promise<InterviewPrepResult> {
  const { resume, job, sections, extractedText } = await loadResumeContext(userId, resumeId, jobId, deps)
  const seed = Date.now() ^ Math.floor(Math.random() * 0x7fffffff)
  const questions = buildGroundedInterviewQuestions({ resume, sections, job, seed })
  const notes = [
    "Questions are based only on your resume (and the selected job if you chose one). They do not invent employers or skills.",
    "Evaluating an answer does not change the question. Generate again to get a new set.",
  ]
  let usedLlm = false

  const llmMessages: ChatLlmMessage[] = [
    {
      role: "system",
      content:
        "You rewrite interview questions with a fresh angle. Return ONLY JSON {\"questions\":[{\"id\":\"\",\"prompt\":\"\"}]}. Keep each id. Do not copy the draft wording. Do not add employers, skills, tools, projects, or achievements that are not in the provided questions or resume facts. Do not create new question ids.",
    },
    {
      role: "user",
      content: JSON.stringify({
        round: seed,
        instruction: "Give each question a different interview angle from the draft while staying strictly grounded.",
        questions,
        skills: resume.skills ?? [],
        experience: resume.experience ?? [],
        extractedText: truncate(extractedText, 5000),
        job: job
          ? {
              title: job.title,
              company: job.company,
              requiredSkills: job.requiredSkills,
              description: truncate(job.description ?? "", 2500),
            }
          : null,
      }),
    },
  ]

  let finalQuestions = questions
  try {
    const raw = await deps.completeChat(llmMessages, getChatLlmConfig())
    finalQuestions = parseQuestions(raw, questions)
    usedLlm = true
  } catch (error) {
    if (error instanceof ChatLlmError) {
      notes.push("Live AI was unavailable. Showing grounded questions generated from your resume data.")
    } else {
      throw error
    }
  }

  if (job) {
    notes.push(`Target role: ${job.title} at ${job.company}.`)
  }

  return {
    resume: { id: resume.id, fileName: resume.fileName },
    job: job ? { id: job.id, title: job.title, company: job.company } : null,
    usedLlm,
    questions: finalQuestions,
    notes: [...new Set(notes)],
  }
}

export async function evaluateInterviewAnswer(
  userId: string,
  input: {
    resumeId: string
    jobId?: string
    question: InterviewQuestion
    answer: string
  },
  deps: InterviewPrepDependencies = defaultDependencies
): Promise<InterviewEvaluation> {
  const answer = input.answer?.trim() ?? ""
  if (!answer) {
    throw new InterviewPrepError("An answer is required.", 400, "ANSWER_REQUIRED")
  }
  if (answer.length > 4000) {
    throw new InterviewPrepError("Answers must be 4000 characters or less.", 400, "ANSWER_TOO_LONG")
  }
  if (!input.question?.id || !input.question.prompt || !input.question.category) {
    throw new InterviewPrepError("A valid question is required.", 400, "QUESTION_REQUIRED")
  }

  const { resume, extractedText } = await loadResumeContext(userId, input.resumeId, input.jobId, deps)
  const companies = (resume.experience ?? []).map((item) => item.company).filter(Boolean)
  const local = evaluateAnswerLocally({
    question: input.question,
    answer,
    resumeSkills: resume.skills ?? [],
    companies,
    resumeText: extractedText,
  })

  const llmMessages: ChatLlmMessage[] = [
    {
      role: "system",
      content:
        "You evaluate an interview answer. Return ONLY JSON {\"score\":0,\"strengths\":[],\"weaknesses\":[],\"suggestions\":[],\"feedback\":\"\"}. Score 0-100. Never credit skills, employers, or achievements that are not in the resume facts. If the answer invents experience, treat that as a weakness.",
    },
    {
      role: "user",
      content: JSON.stringify({
        question: input.question,
        answer,
        resumeSkills: resume.skills ?? [],
        experience: resume.experience ?? [],
        extractedText: truncate(extractedText, 5000),
        localHeuristic: local,
      }),
    },
  ]

  try {
    const raw = await deps.completeChat(llmMessages, getChatLlmConfig())
    const parsed = parseEvaluation(raw, local)
    if (!parsed.strengths.length && !parsed.weaknesses.length) return local
    return parsed
  } catch (error) {
    if (error instanceof ChatLlmError) return local
    throw error
  }
}

