import { normalizeForNlp } from "@/services/nlp/preprocess"
import {
  buildSkillMatchTerms,
  loadSkillDictionary,
  type SkillDefinition,
} from "@/services/nlp/skill-dictionary"
import type { ExtractedSkill } from "@/types/resume"

export type { ExtractedSkill }

const WEAK_STANDALONE_TERMS = new Set(["go", "next", "c", "r"])

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function createTermPattern(term: string): RegExp {
  return new RegExp(`(?<![a-z0-9+.#/])${escapeRegex(term)}(?![a-z0-9+.#/])`, "gi")
}

function containsTerm(haystack: string, term: string): boolean {
  return createTermPattern(term).test(haystack)
}

function maskTerm(haystack: string, term: string): string {
  return haystack.replace(createTermPattern(term), " ")
}

/**
 * Dictionary-based skill extractor.
 * Phrase matching can later be swapped for semantic models without changing callers.
 */
export function extractSkills(
  rawText: string,
  dictionary: SkillDefinition[] = loadSkillDictionary()
): ExtractedSkill[] {
  const normalized = normalizeForNlp(rawText)
  if (!normalized) return []

  const dotted = normalized
  const spaced = normalized.replace(/\./g, " ")
  let haystack = ` ${dotted} ${spaced} `

  const found = new Map<string, ExtractedSkill>()

  for (const entry of buildSkillMatchTerms(dictionary)) {
    const term = normalizeForNlp(entry.term)
    if (!term || WEAK_STANDALONE_TERMS.has(term)) continue

    if (!containsTerm(haystack, term)) continue

    haystack = maskTerm(haystack, term)

    const current = found.get(entry.name)
    if (!current || entry.confidence > current.confidence) {
      found.set(entry.name, {
        name: entry.name,
        category: entry.category,
        confidence: entry.confidence,
      })
    }
  }

  return Array.from(found.values()).sort(
    (a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name)
  )
}
