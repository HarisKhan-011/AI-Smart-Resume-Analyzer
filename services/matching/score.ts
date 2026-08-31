import { config } from "@/lib/config"
import type { MatchScoreBreakdown } from "@/services/matching/types"

type ScorePart = {
  score: number
  weight: number
  enabled: boolean
}

export function roundScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function coverageScore(matchedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  return roundScore((matchedCount / totalCount) * 100)
}

/**
 * Weighted overall score.
 * Disabled dimensions (experience/education/semantic) are ignored and
 * remaining weights are renormalized so skills-only scoring stays 0–100.
 */
export function weightedOverallScore(parts: ScorePart[]): number {
  const active = parts.filter((part) => part.enabled)
  const totalWeight = active.reduce((sum, part) => sum + part.weight, 0)
  if (totalWeight <= 0) return 0

  const raw = active.reduce((sum, part) => sum + part.score * (part.weight / totalWeight), 0)
  return roundScore(raw)
}

export function calculateMatchScores(input: {
  requiredMatched: number
  requiredTotal: number
  experienceScore?: number
  educationScore?: number
}): MatchScoreBreakdown {
  const skillScore = coverageScore(input.requiredMatched, input.requiredTotal)

  return {
    skillScore,
    experienceScore: 0,
    educationScore: 0,
    overallScore: weightedOverallScore([
      { score: skillScore, weight: config.matching.weight.skills, enabled: true },
      {
        score: input.experienceScore ?? 0,
        weight: config.matching.weight.experience,
        enabled: false,
      },
      {
        score: input.educationScore ?? 0,
        weight: config.matching.weight.education,
        enabled: false,
      },
    ]),
  }
}
