import { compareSkills } from "@/services/matching/compare-skills"
import { calculateMatchScores } from "@/services/matching/score"
import type { CalculatedMatch } from "@/services/matching/types"

export type { CalculatedMatch, SkillComparison } from "@/services/matching/types"

/**
 * Skills-only resume ↔ job matcher.
 * Experience, education, and semantic similarity can be added later
 * without changing the public calculateMatch() result shape.
 */
export function calculateMatch(input: {
  resumeSkills: string[]
  requiredSkills: string[]
  preferredSkills?: string[]
}): CalculatedMatch {
  const comparison = compareSkills(
    input.resumeSkills,
    input.requiredSkills,
    input.preferredSkills ?? []
  )
  const scores = calculateMatchScores({
    requiredMatched: comparison.matchedSkills.length,
    requiredTotal: comparison.matchedSkills.length + comparison.missingSkills.length,
  })

  return {
    ...comparison,
    ...scores,
  }
}
