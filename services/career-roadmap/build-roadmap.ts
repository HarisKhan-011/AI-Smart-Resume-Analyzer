import { getLearningSuggestion } from "@/lib/learning-suggestions"
import { calculateSkillGap } from "@/services/skill-gap/skill-gap-service"
import type { Resume } from "@/types/resume"
import type { Job } from "@/types/job"
import type {
  CareerRoadmapResult,
  RoadmapPriority,
  RoadmapStage,
  RoadmapStep,
} from "@/types/career-roadmap"

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

function splitRequired(skills: string[]): { beginner: string[]; intermediate: string[] } {
  if (skills.length <= 1) {
    return { beginner: skills, intermediate: [] }
  }
  const mid = Math.ceil(skills.length / 2)
  return {
    beginner: skills.slice(0, mid),
    intermediate: skills.slice(mid),
  }
}

function toSteps(
  skills: string[],
  priority: RoadmapPriority,
  required: boolean
): RoadmapStep[] {
  return skills.map((skill) => ({
    skill,
    topic: getLearningSuggestion(skill),
    priority,
    required,
  }))
}

export function buildCareerRoadmap(input: {
  resume: Pick<Resume, "id" | "fileName" | "skills" | "experience" | "atsScore" | "atsAnalysisStatus" | "atsSuggestions">
  job: Pick<Job, "id" | "title" | "company" | "location" | "requiredSkills" | "preferredSkills">
  matchScore?: number | null
}): CareerRoadmapResult {
  const gap = calculateSkillGap({
    resumeSkills: input.resume.skills ?? [],
    requiredSkills: input.job.requiredSkills ?? [],
    preferredSkills: input.job.preferredSkills ?? [],
  })

  const { beginner, intermediate } = splitRequired(gap.missingSkills)
  const stages: RoadmapStage[] = [
    {
      level: "beginner",
      title: "Beginner",
      description: "Close the first required skill gaps for this role. Only skills missing from your resume are listed.",
      steps: toSteps(beginner, "high", true),
    },
    {
      level: "intermediate",
      title: "Intermediate",
      description: "Cover the remaining required skills after the first learning block.",
      steps: toSteps(intermediate, "high", true),
    },
    {
      level: "advanced",
      title: "Advanced",
      description: "Preferred skills for this job that are not on your resume. Skip any that you cannot support yet.",
      steps: toSteps(gap.preferredMissingSkills, "medium", false),
    },
  ]

  const notes: string[] = [
    "This roadmap uses only skills already on your resume and skills listed on the selected job. It does not invent experience.",
  ]
  if (!(input.resume.skills ?? []).length) {
    notes.push("This resume has no extracted skills yet. Analyze it before treating the roadmap as complete.")
  }
  if (gap.missingSkills.length === 0 && gap.preferredMissingSkills.length === 0) {
    notes.push("Your resume already covers the listed required and preferred skills for this job.")
  }
  if (input.resume.atsAnalysisStatus === "completed" && (input.resume.atsSuggestions ?? []).length) {
    notes.push(`ATS notes from your resume: ${(input.resume.atsSuggestions ?? []).slice(0, 2).join(" ")}`)
  }

  const experience = unique(
    (input.resume.experience ?? [])
      .map((item) => [item.position, item.company].filter(Boolean).join(" at "))
      .filter(Boolean)
  ).slice(0, 6)

  return {
    resume: {
      id: input.resume.id,
      fileName: input.resume.fileName,
      atsScore: input.resume.atsScore ?? null,
      atsAnalysisStatus: input.resume.atsAnalysisStatus ?? "pending",
    },
    target: {
      id: input.job.id,
      title: input.job.title,
      company: input.job.company,
      location: input.job.location,
      requiredSkills: input.job.requiredSkills ?? [],
      preferredSkills: input.job.preferredSkills ?? [],
    },
    coveragePercent: gap.coveragePercent,
    matchScore: input.matchScore ?? null,
    currentSkills: unique([...gap.matchedSkills, ...gap.preferredMatchedSkills]),
    missingSkills: gap.missingSkills,
    preferredMissingSkills: gap.preferredMissingSkills,
    experience,
    stages,
    notes,
  }
}
