import { hasSkill, uniqueSkillNames } from "@/services/matching/normalize-skills"
import type { SkillComparison } from "@/services/matching/types"

export function compareSkills(
  resumeSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[] = []
): SkillComparison {
  const resume = uniqueSkillNames(resumeSkills)
  const required = uniqueSkillNames(requiredSkills)
  const preferred = uniqueSkillNames(preferredSkills).filter(
    (skill) => !hasSkill(required, skill)
  )

  return {
    matchedSkills: required.filter((skill) => hasSkill(resume, skill)),
    missingSkills: required.filter((skill) => !hasSkill(resume, skill)),
    preferredMatchedSkills: preferred.filter((skill) => hasSkill(resume, skill)),
    preferredMissingSkills: preferred.filter((skill) => !hasSkill(resume, skill)),
  }
}
