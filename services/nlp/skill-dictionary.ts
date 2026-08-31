import skillsData from "@/data/skills.json"

export type SkillDefinition = {
  name: string
  category: string
  aliases: string[]
}

export type SkillMatchTerm = {
  term: string
  name: string
  category: string
  confidence: number
}

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>()
  const terms: string[] = []
  for (const value of values) {
    const key = value.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    terms.push(value.trim())
  }
  return terms
}

export function loadSkillDictionary(
  skills: SkillDefinition[] = skillsData.skills
): SkillDefinition[] {
  return skills.map((skill) => ({
    name: skill.name,
    category: skill.category,
    aliases: skill.aliases ?? [],
  }))
}

export function buildSkillMatchTerms(skills: SkillDefinition[]): SkillMatchTerm[] {
  const terms: SkillMatchTerm[] = []

  for (const skill of skills) {
    terms.push({
      term: skill.name,
      name: skill.name,
      category: skill.category,
      confidence: 0.95,
    })

    for (const alias of skill.aliases) {
      terms.push({
        term: alias,
        name: skill.name,
        category: skill.category,
        confidence: 0.9,
      })
    }
  }

  return uniqueTerms(terms.map((item) => item.term))
    .map((term) => terms.find((item) => item.term.toLowerCase() === term.toLowerCase())!)
    .sort((a, b) => b.term.length - a.term.length || b.confidence - a.confidence)
}

export function getSkillByName(
  name: string,
  skills: SkillDefinition[] = loadSkillDictionary()
): SkillDefinition | undefined {
  const needle = name.trim().toLowerCase()
  return skills.find((skill) => skill.name.toLowerCase() === needle)
}

export function groupSkillsByCategory<T extends { name: string; category: string }>(
  skills: T[]
): Array<{ category: string; skills: T[] }> {
  const groups = new Map<string, T[]>()
  for (const skill of skills) {
    const current = groups.get(skill.category) ?? []
    current.push(skill)
    groups.set(skill.category, current)
  }

  return Array.from(groups.entries()).map(([category, grouped]) => ({
    category,
    skills: grouped,
  }))
}
