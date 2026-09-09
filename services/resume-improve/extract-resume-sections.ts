import type { ResumeImproveSectionKey } from "@/types/resume-improve"
import type { Resume } from "@/types/resume"

const HEADINGS: Array<{ key: ResumeImproveSectionKey | "other"; pattern: RegExp }> = [
  { key: "summary", pattern: /^(professional\s+)?(summary|profile|objective|about(\s+me)?)\b/i },
  {
    key: "experience",
    pattern:
      /^(work(\s+experience|\s+history)?|experience|employment|professional\s+experience|career(\s+history)?)\b/i,
  },
  { key: "projects", pattern: /^(projects|selected\s+projects|personal\s+projects|portfolio)\b/i },
  { key: "skills", pattern: /^(skills|technical\s+skills|core\s+competenc(y|ies)|technologies)\b/i },
  { key: "other", pattern: /^(education|academic(\s+background)?|qualifications|certifications?|certificates|licenses)\b/i },
]

export type ExtractedResumeSections = Record<ResumeImproveSectionKey, string>

function isHeading(line: string): { key: ResumeImproveSectionKey | "other" } | null {
  const heading = line.replace(/[:\-–—|]+$/g, "").replace(/^#+\s*/, "").trim()
  if (!heading || heading.length > 48) return null
  for (const item of HEADINGS) {
    if (item.pattern.test(heading)) return { key: item.key }
  }
  return null
}

function firstContentLines(text: string): string {
  const skip = /@|https?:\/\/|linkedin|github|\+?\d[\d\s().-]{7,}\d/i
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !skip.test(line) && !isHeading(line))
  return lines.slice(0, 6).join("\n").trim()
}

function formatStoredExperience(resume: Pick<Resume, "experience">): string {
  return (resume.experience ?? [])
    .map((item) => {
      const dates = [item.startDate, item.endDate].filter(Boolean).join(" – ")
      const header = [item.position, item.company].filter(Boolean).join(", ")
      const bits = [header, dates, item.description].filter(Boolean)
      return bits.join("\n")
    })
    .filter(Boolean)
    .join("\n\n")
}

export function extractResumeSections(
  text: string,
  resume: Pick<Resume, "skills" | "experience">
): ExtractedResumeSections {
  const sections: ExtractedResumeSections = {
    summary: "",
    experience: "",
    projects: "",
    skills: "",
  }

  const lines = text.split(/\r?\n/)
  let current: ResumeImproveSectionKey | "other" | null = null
  const buckets: Record<string, string[]> = {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    other: [],
  }

  for (const raw of lines) {
    const heading = isHeading(raw.trim())
    if (heading) {
      current = heading.key
      continue
    }
    if (!current) continue
    buckets[current].push(raw)
  }

  sections.summary = buckets.summary.join("\n").trim()
  sections.experience = buckets.experience.join("\n").trim()
  sections.projects = buckets.projects.join("\n").trim()
  sections.skills = buckets.skills.join("\n").trim()

  if (!sections.summary) {
    sections.summary = firstContentLines(text)
  }
  if (!sections.experience) {
    sections.experience = formatStoredExperience(resume)
  }
  if (!sections.skills && resume.skills.length > 0) {
    sections.skills = resume.skills.join(", ")
  }

  return sections
}
