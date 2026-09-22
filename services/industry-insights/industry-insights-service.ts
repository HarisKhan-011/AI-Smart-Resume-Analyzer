import catalog from "@/data/industry-insights.json"
import { hasSkill, uniqueSkillNames } from "@/services/matching/normalize-skills"
import type {
  IndustryDefinition,
  IndustryInsightsResult,
  IndustryInsightsSummary,
} from "@/types/industry-insights"

const INDUSTRIES = catalog.industries as IndustryDefinition[]
const DISCLAIMER = catalog.disclaimer

function uniqueHints(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))]
}

function scoreIndustry(industry: IndustryDefinition, skills: string[], roleHints: string[]): number {
  const matchedSkills = industry.inDemandSkills.filter((skill) => hasSkill(skills, skill)).length
  const hintHits = uniqueHints(roleHints).filter((hint) =>
    industry.roleHints.some((roleHint) => hint.includes(roleHint) || roleHint.includes(hint))
  ).length
  return matchedSkills * 10 + hintHits * 4
}

function fitScore(matched: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((matched / total) * 100)))
}

export function buildIndustryInsights(input: {
  resumeId: string
  resumeFileName: string
  skills: string[]
  roleHints?: string[]
}): IndustryInsightsResult | null {
  const skills = uniqueSkillNames(input.skills)
  const roleHints = uniqueHints(input.roleHints ?? [])
  if (skills.length === 0) return null

  const ranked = INDUSTRIES.map((industry) => ({
    industry,
    score: scoreIndustry(industry, skills, roleHints),
  })).sort((a, b) => b.score - a.score || a.industry.name.localeCompare(b.industry.name))

  const winner = ranked[0]
  if (!winner || winner.score <= 0) return null

  const matchedCount = winner.industry.inDemandSkills.filter((skill) => hasSkill(skills, skill)).length
  const nextSkills = winner.industry.nextSkills.filter((skill) => !hasSkill(skills, skill)).slice(0, 4)
  const alternatives = ranked
    .slice(1, 3)
    .filter((item) => item.score > 0)
    .map((item) => ({
      id: item.industry.id,
      name: item.industry.name,
      fitScore: fitScore(
        item.industry.inDemandSkills.filter((skill) => hasSkill(skills, skill)).length,
        item.industry.inDemandSkills.length
      ),
    }))

  return {
    resumeId: input.resumeId,
    resumeFileName: input.resumeFileName,
    industryId: winner.industry.id,
    industryName: winner.industry.name,
    summary: winner.industry.summary,
    outlook: winner.industry.outlook,
    outlookNote: winner.industry.outlookNote,
    salaryRange: winner.industry.salaryRange,
    hiringFocus: winner.industry.hiringFocus,
    fitScore: fitScore(matchedCount, winner.industry.inDemandSkills.length),
    matchedCount,
    inDemandCount: winner.industry.inDemandSkills.length,
    typicalRoles: winner.industry.typicalRoles,
    skillCoverage: winner.industry.inDemandSkills.map((skill) => ({
      skill,
      present: hasSkill(skills, skill),
    })),
    nextSkills,
    alternatives,
    disclaimer: DISCLAIMER,
  }
}

export function toIndustryInsightsSummary(
  result: IndustryInsightsResult | null
): IndustryInsightsSummary | null {
  if (!result) return null
  return {
    industryName: result.industryName,
    fitScore: result.fitScore,
    outlook: result.outlook,
    matchedCount: result.matchedCount,
    inDemandCount: result.inDemandCount,
  }
}
