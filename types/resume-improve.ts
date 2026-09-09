export type ResumeImproveSectionKey = "summary" | "experience" | "projects" | "skills"

export type ResumeImproveSection = {
  key: ResumeImproveSectionKey
  label: string
  original: string
  improved: string
}

export type ResumeImproveResult = {
  resume: {
    id: string
    fileName: string
    atsScore: number | null
  }
  job: {
    id: string
    title: string
    company: string
  } | null
  usedLlm: boolean
  originalUnchanged: true
  sections: ResumeImproveSection[]
  notes: string[]
}

export const RESUME_IMPROVE_SECTION_LABELS: Record<ResumeImproveSectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
}
