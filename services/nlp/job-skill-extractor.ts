import { extractSkills } from "@/services/nlp/skill-extractor"
import { splitJobDescription } from "@/services/nlp/job-sections"
import type { ExtractedSkill } from "@/types/resume"
import type { SkillDefinition } from "@/services/nlp/skill-dictionary"

export type JobSkillExtraction = {
  requiredSkills: string[]
  preferredSkills: string[]
  detectedSkills: ExtractedSkill[]
  technicalSkills: ExtractedSkill[]
  toolSkills: ExtractedSkill[]
}

const TECHNICAL_CATEGORIES = new Set([
  "Programming Languages",
  "Web Development",
  "Databases",
  "Cloud",
  "AI/ML",
  "DevOps",
])

const TOOL_CATEGORIES = new Set(["Tools"])

function uniqueNames(skills: ExtractedSkill[]): string[] {
  return Array.from(new Set(skills.map((skill) => skill.name)))
}

function namesToSkills(
  names: string[],
  catalog: Map<string, ExtractedSkill>
): ExtractedSkill[] {
  return names
    .map((name) => catalog.get(name))
    .filter((skill): skill is ExtractedSkill => Boolean(skill))
}

/**
 * Extracts and classifies job-description skills using the Phase 6 dictionary matcher.
 */
export function extractJobSkills(
  description: string,
  dictionary?: SkillDefinition[]
): JobSkillExtraction {
  const sections = splitJobDescription(description)
  const requiredSection = [sections.required, sections.general].filter(Boolean).join("\n")

  const requiredDetected = extractSkills(requiredSection, dictionary)
  const preferredDetected = extractSkills(sections.preferred, dictionary)
  const allDetected = extractSkills(description, dictionary)

  const requiredSet = new Set(uniqueNames(requiredDetected))
  const preferredSkills = uniqueNames(preferredDetected).filter((name) => !requiredSet.has(name))
  const requiredSkills = uniqueNames(requiredDetected)

  const catalog = new Map(allDetected.map((skill) => [skill.name, skill]))
  const detectedSkills = allDetected

  return {
    requiredSkills,
    preferredSkills,
    detectedSkills,
    technicalSkills: namesToSkills(
      detectedSkills.filter((skill) => TECHNICAL_CATEGORIES.has(skill.category)).map((skill) => skill.name),
      catalog
    ),
    toolSkills: namesToSkills(
      detectedSkills.filter((skill) => TOOL_CATEGORIES.has(skill.category)).map((skill) => skill.name),
      catalog
    ),
  }
}
