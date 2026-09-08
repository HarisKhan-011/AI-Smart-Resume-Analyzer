import { extractSkills, type ExtractedSkill } from "@/services/nlp/skill-extractor"
import { analyzeResumeForAts, type AtsAnalyzerResult } from "@/services/ats/ats-analyzer"
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
  ats: AtsAnalyzerResult | null
}

type AnalyzeDependencies = {
  getOwnedResume: typeof getOwnedResume
  updateOwnedResume: typeof updateOwnedResume
  extractSkills: typeof extractSkills
  analyzeAts?: typeof analyzeResumeForAts
}

const defaultDependencies: AnalyzeDependencies = {
  getOwnedResume,
  updateOwnedResume,
  extractSkills,
  analyzeAts: analyzeResumeForAts,
}

function failedAtsFields(): Pick<
  UpdateResumeInput,
  "atsIssues" | "atsSuggestions" | "atsStrengths" | "atsAnalysisStatus"
> {
  return {
    atsIssues: [],
    atsSuggestions: [],
    atsStrengths: [],
    atsAnalysisStatus: "failed",
  }
}

function completedAtsFields(result: AtsAnalyzerResult): UpdateResumeInput {
  return {
    atsScore: result.score,
    atsBreakdown: result.breakdown,
    atsIssues: result.issues,
    atsSuggestions: result.suggestions,
    atsStrengths: result.strengths,
    atsAnalysisStatus: "completed",
  }
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
    const analyzeAts = deps.analyzeAts ?? analyzeResumeForAts
    let ats: AtsAnalyzerResult | null = null
    let atsUpdate: UpdateResumeInput = failedAtsFields()

    try {
      ats = analyzeAts({ text: extractedText, skills })
      atsUpdate = completedAtsFields(ats)
    } catch (atsError) {
      console.error("ATS analysis failed", {
        resumeId,
        userId,
        error: atsError instanceof Error ? atsError.message : "unknown",
      })
    }

    const update: UpdateResumeInput = {
      skills: skills.map((skill) => skill.name),
      extractedSkills: skills,
      analysisStatus: "completed",
      ...atsUpdate,
    }
    const saved = await deps.updateOwnedResume(resumeId, userId, update)
    if (!saved) {
      throw new ResumeAnalysisError("Resume not found.", 404, "NOT_FOUND")
    }

    return {
      resume: { ...saved, extractedText },
      skills,
      skillCount: skills.length,
      ats,
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
