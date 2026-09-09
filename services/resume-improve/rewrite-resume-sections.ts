import type { ExtractedResumeSections } from "@/services/resume-improve/extract-resume-sections"
import type { ResumeImproveSectionKey } from "@/types/resume-improve"

const ACTION_VERBS = new Set([
  "achieved",
  "analyzed",
  "automated",
  "built",
  "collaborated",
  "created",
  "delivered",
  "deployed",
  "designed",
  "developed",
  "drove",
  "engineered",
  "improved",
  "implemented",
  "launched",
  "led",
  "managed",
  "optimized",
  "owned",
  "reduced",
  "supported",
])

function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const skill of skills) {
    const name = skill.replace(/^[-*•●]\s*/, "").trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(name)
  }
  return result
}

export function extractNumbers(text: string): Set<string> {
  const matches = text.match(/\d+(?:[.,]\d+)?%?/g) ?? []
  return new Set(matches.map((item) => item.replace(/,/g, "")))
}

export function hasInventedNumbers(original: string, improved: string): boolean {
  const allowed = extractNumbers(original)
  for (const value of extractNumbers(improved)) {
    if (!allowed.has(value)) return true
  }
  return false
}

function splitSkillList(text: string): string[] {
  return uniqueSkills(
    text
      .split(/[\n,•|;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function skillAllowed(skill: string, haystack: string): boolean {
  const needle = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (!needle) return false
  return new RegExp(`(?:^|[^a-z0-9+.#])${needle}(?:$|[^a-z0-9+.#])`, "i").test(haystack)
}

export function filterSkillsToKnown(improved: string, allowedSource: string): string {
  const kept = splitSkillList(improved).filter((skill) => skillAllowed(skill, allowedSource))
  return kept.join(", ")
}

function rewriteBulletLine(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ""
  const content = trimmed.replace(/^[-*•●▪‣]\s*/, "").replace(/^\d+[.)]\s*/, "").trim()
  if (!content) return ""
  const [first, ...rest] = content.split(/\s+/)
  const verb = first?.toLowerCase() ?? ""
  const remainder = rest.join(" ")
  if (ACTION_VERBS.has(verb)) {
    const pretty = `${first.charAt(0).toUpperCase()}${first.slice(1).toLowerCase()}`
    return `• ${pretty}${remainder ? ` ${remainder}` : ""}`
  }
  return `• ${content.charAt(0).toUpperCase()}${content.slice(1)}`
}

function rewriteBullets(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return ""
  return lines.map(rewriteBulletLine).filter(Boolean).join("\n")
}

function rewriteSummary(original: string, overlappingSkills: string[]): string {
  const cleaned = original.replace(/\s+/g, " ").trim()
  if (!cleaned) return ""
  if (overlappingSkills.length === 0) return cleaned
  const already = overlappingSkills.filter((skill) =>
    cleaned.toLowerCase().includes(skill.toLowerCase())
  )
  if (already.length === 0) return cleaned
  return cleaned
}

function rewriteSkills(original: string, resumeSkills: string[], overlappingSkills: string[]): string {
  const fromText = splitSkillList(original)
  const merged = uniqueSkills([...overlappingSkills, ...resumeSkills, ...fromText])
  return merged.join(", ")
}

export function rewriteSectionsLocally(input: {
  original: ExtractedResumeSections
  resumeSkills: string[]
  jobRequiredSkills?: string[]
}): ExtractedResumeSections {
  const haystack = `${input.original.summary}\n${input.original.experience}\n${input.original.projects}\n${input.original.skills}\n${input.resumeSkills.join(" ")}`
  const overlapping = (input.jobRequiredSkills ?? []).filter((skill) => skillAllowed(skill, haystack))

  const improved: ExtractedResumeSections = {
    summary: rewriteSummary(input.original.summary, overlapping),
    experience: rewriteBullets(input.original.experience),
    projects: rewriteBullets(input.original.projects),
    skills: rewriteSkills(input.original.skills, input.resumeSkills, overlapping),
  }

  for (const key of Object.keys(improved) as ResumeImproveSectionKey[]) {
    if (hasInventedNumbers(input.original[key], improved[key])) {
      improved[key] = input.original[key]
    }
  }

  if (improved.skills) {
    improved.skills = filterSkillsToKnown(improved.skills, haystack)
  }

  return improved
}

export function sanitizeLlmSections(input: {
  original: ExtractedResumeSections
  proposed: Partial<ExtractedResumeSections>
  resumeSkills: string[]
}): ExtractedResumeSections {
  const haystack = `${input.original.summary}\n${input.original.experience}\n${input.original.projects}\n${input.original.skills}\n${input.resumeSkills.join(" ")}`
  const result: ExtractedResumeSections = { ...input.original }

  for (const key of Object.keys(result) as ResumeImproveSectionKey[]) {
    const proposed = input.proposed[key]?.trim()
    if (!proposed) continue
    if (hasInventedNumbers(haystack, proposed)) {
      continue
    }
    result[key] = key === "skills" ? filterSkillsToKnown(proposed, haystack) : proposed
  }

  return result
}
