export function normalizeSkillName(skill: string): string {
  return skill.trim().toLowerCase()
}

export function uniqueSkillNames(skills: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const skill of skills) {
    const trimmed = skill.trim()
    if (!trimmed) continue
    const key = normalizeSkillName(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(trimmed)
  }
  return unique
}

export function skillKeySet(skills: string[]): Set<string> {
  return new Set(uniqueSkillNames(skills).map(normalizeSkillName))
}

export function hasSkill(skills: string[], skill: string): boolean {
  return skillKeySet(skills).has(normalizeSkillName(skill))
}
