import { extractSkills, type ExtractedSkill } from "@/services/nlp/skill-extractor"
import {
  getOwnedResume,
  updateOwnedResume,
  type UpdateResumeInput,
} from "@/services/resume-service"
import type { Resume } from "@/types/resume"

export class ResumeAnalysisError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "ANALYSIS_ERROR") {
    super(message)
    this.name = "ResumeAnalysisError"
    this.status = status
    this.code = code
  }
}

export type AnalyzeResumeResult = {
  resume: Resume
  skills: ExtractedSkill[]
  skillCount: number
}

type AnalyzeDependencies = {
  getOwnedResume: typeof getOwnedResume
  updateOwnedResume: typeof updateOwnedResume
  extractSkills: typeof extractSkills
}

const defaultDependencies: AnalyzeDependencies = {
  getOwnedResume,
  updateOwnedResume,
  extractSkills,
}

export async function analyzeOwnedResume(
  resumeId: string,
  userId: string,
  deps: AnalyzeDependencies = defaultDependencies
): Promise<AnalyzeResumeResult> {
  const resume = await deps.getOwnedResume(resumeId, userId)
  if (!resume) {
    throw new ResumeAnalysisError("Resume not found.", 404, "NOT_FOUND")
  }

  const extractedText = resume.extractedText?.trim() ?? ""
  if (!extractedText) {
    throw new ResumeAnalysisError(
      "This resume has no extracted text to analyze.",
      400,
      "NO_TEXT"
    )
  }

  await deps.updateOwnedResume(resumeId, userId, { analysisStatus: "processing" })

  try {
    const skills = deps.extractSkills(extractedText)
    const update: UpdateResumeInput = {
      skills: skills.map((skill) => skill.name),
      extractedSkills: skills,
      analysisStatus: "completed",
    }
    const saved = await deps.updateOwnedResume(resumeId, userId, update)
    if (!saved) {
      throw new ResumeAnalysisError("Resume not found.", 404, "NOT_FOUND")
    }

    return {
      resume: { ...saved, extractedText },
      skills,
      skillCount: skills.length,
    }
  } catch (error) {
    if (error instanceof ResumeAnalysisError) {
      await deps.updateOwnedResume(resumeId, userId, { analysisStatus: "failed" }).catch(() => undefined)
      throw error
    }

    await deps.updateOwnedResume(resumeId, userId, { analysisStatus: "failed" }).catch(() => undefined)
    throw error
  }
}
