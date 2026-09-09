import { getOwnedResume } from "@/services/resume-service"
import { getAccessibleJob } from "@/services/job-service"
import { completeChat, ChatLlmError, getChatLlmConfig, type ChatLlmMessage } from "@/services/chat/chat-llm"
import { extractResumeSections } from "@/services/resume-improve/extract-resume-sections"
import {
  rewriteSectionsLocally,
  sanitizeLlmSections,
} from "@/services/resume-improve/rewrite-resume-sections"
import {
  RESUME_IMPROVE_SECTION_LABELS,
  type ResumeImproveResult,
  type ResumeImproveSectionKey,
} from "@/types/resume-improve"
import type { Resume } from "@/types/resume"
import type { Job } from "@/types/job"

export class ResumeImproveError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "RESUME_IMPROVE_ERROR") {
    super(message)
    this.name = "ResumeImproveError"
    this.status = status
    this.code = code
  }
}

const SECTION_KEYS: ResumeImproveSectionKey[] = ["summary", "experience", "projects", "skills"]

const SYSTEM_PROMPT = `You rewrite resume sections for ATS readability.

Return ONLY valid JSON with this shape:
{"summary":"","experience":"","projects":"","skills":"","notes":[""]}

Hard rules:
- Use only facts present in the original sections, extracted resume text, and listed skills.
- Never invent employers, job titles, dates, projects, achievements, metrics, or skills.
- Never add numbers, percentages, or dollar amounts that are not already in the resume text.
- You may tighten wording, use a stronger verb for the same action, and reorder bullets.
- If a target job is provided, emphasize overlapping skills that already appear on the resume. Do not add required skills the resume does not already contain.
- If an original section is empty, set improved text to an empty string. Do not fabricate that section.
- Do not claim the user worked at the target company unless that employer is already in the resume.`

function truncate(text: string, max: number): string {
  const value = text.trim()
  if (value.length <= max) return value
  return `${value.slice(0, max).trimEnd()}…`
}

function parseLlmJson(raw: string): {
  summary?: string
  experience?: string
  projects?: string
  skills?: string
  notes?: string[]
} | null {
  const fenced = raw.match(/\{[\s\S]*\}/)
  const payload = fenced?.[0] ?? raw
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>
    if (!parsed || typeof parsed !== "object") return null
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
      experience: typeof parsed.experience === "string" ? parsed.experience : undefined,
      projects: typeof parsed.projects === "string" ? parsed.projects : undefined,
      skills: typeof parsed.skills === "string" ? parsed.skills : undefined,
      notes: Array.isArray(parsed.notes)
        ? parsed.notes.filter((item): item is string => typeof item === "string")
        : undefined,
    }
  } catch {
    return null
  }
}

type ImproveDependencies = {
  getOwnedResume: typeof getOwnedResume
  getAccessibleJob: typeof getAccessibleJob
  completeChat: typeof completeChat
}

const defaultDependencies: ImproveDependencies = {
  getOwnedResume,
  getAccessibleJob,
  completeChat,
}

export async function improveOwnedResume(
  userId: string,
  resumeId: string,
  jobId?: string,
  deps: ImproveDependencies = defaultDependencies
): Promise<ResumeImproveResult> {
  const id = resumeId.trim()
  if (!id) {
    throw new ResumeImproveError("A resume is required.", 400, "RESUME_REQUIRED")
  }

  const resume = await deps.getOwnedResume(id, userId)
  if (!resume) {
    throw new ResumeImproveError("Resume not found.", 404, "NOT_FOUND")
  }

  const extractedText = resume.extractedText?.trim() ?? ""
  if (!extractedText) {
    throw new ResumeImproveError(
      "This resume has no extracted text to improve.",
      400,
      "NO_TEXT"
    )
  }

  let job: Job | null = null
  const targetJobId = jobId?.trim() ?? ""
  if (targetJobId) {
    job = await deps.getAccessibleJob(targetJobId, userId)
    if (!job) {
      throw new ResumeImproveError("Job not found.", 404, "JOB_NOT_FOUND")
    }
  }

  const original = extractResumeSections(extractedText, resume)
  const notes: string[] = [
    "These suggestions do not change or overwrite your stored resume. Copy any text you want to use.",
  ]

  if (resume.atsIssues?.length) {
    notes.push(`ATS issues to keep in mind: ${resume.atsIssues.slice(0, 3).join(" ")}`)
  }

  let usedLlm = false
  let improved = rewriteSectionsLocally({
    original,
    resumeSkills: resume.skills ?? [],
    jobRequiredSkills: job?.requiredSkills,
  })

  const llmMessages: ChatLlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        originalSections: original,
        skills: resume.skills ?? [],
        ats: {
          score: resume.atsScore ?? null,
          issues: resume.atsIssues ?? [],
          suggestions: resume.atsSuggestions ?? [],
        },
        extractedText: truncate(extractedText, 7000),
        targetJob: job
          ? {
              title: job.title,
              company: job.company,
              requiredSkills: job.requiredSkills,
              preferredSkills: job.preferredSkills,
              description: truncate(job.description ?? "", 3500),
            }
          : null,
      }),
    },
  ]

  try {
    const raw = await deps.completeChat(llmMessages, getChatLlmConfig())
    const parsed = parseLlmJson(raw)
    if (parsed) {
      improved = sanitizeLlmSections({
        original,
        proposed: parsed,
        resumeSkills: resume.skills ?? [],
      })
      usedLlm = true
      if (parsed.notes?.length) {
        notes.push(...parsed.notes.slice(0, 4))
      }
    } else {
      notes.push("The AI reply was not usable JSON, so rule-based rewrites of your existing text were used.")
    }
  } catch (error) {
    if (error instanceof ChatLlmError) {
      notes.push("Live AI was unavailable. Suggestions are rule-based rewrites that keep your original facts.")
    } else {
      throw error
    }
  }

  if (job) {
    notes.push(
      `Target job: ${job.title} at ${job.company}. Only overlapping skills already on the resume were emphasized.`
    )
  }

  return {
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      atsScore: resume.atsScore ?? null,
    },
    job: job ? { id: job.id, title: job.title, company: job.company } : null,
    usedLlm,
    originalUnchanged: true,
    sections: SECTION_KEYS.map((key) => ({
      key,
      label: RESUME_IMPROVE_SECTION_LABELS[key],
      original: original[key],
      improved: improved[key] || original[key],
    })),
    notes: [...new Set(notes)],
  }
}
