import suggestions from "@/data/learning-suggestions.json"
import { normalizeSkillName } from "@/services/matching/normalize-skills"

const suggestionMap = new Map(
  Object.entries(suggestions).map(([skill, suggestion]) => [
    normalizeSkillName(skill),
    suggestion,
  ])
)

export function getLearningSuggestion(skill: string): string {
  const configured = suggestionMap.get(normalizeSkillName(skill))
  if (configured) return configured
  return `Learn ${skill.trim()} fundamentals`
}

export function getLearningSuggestions(skills: string[]): Array<{ skill: string; suggestion: string }> {
  return skills.map((skill) => ({
    skill,
    suggestion: getLearningSuggestion(skill),
  }))
}
