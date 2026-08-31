const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "its",
  "may",
  "of",
  "on",
  "or",
  "should",
  "so",
  "than",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "this",
  "those",
  "to",
  "was",
  "were",
  "will",
  "with",
  "would",
])

export type PreprocessedResumeText = {
  normalized: string
  tokens: string[]
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

export function normalizeForNlp(text: string): string {
  return normalizeWhitespace(
    text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[^a-z0-9+.#/\s-]+/g, " ")
  )
}

export function tokenize(text: string): string[] {
  return normalizeForNlp(text)
    .split(" ")
    .map((token) => token.replace(/^[-.]+|[-.]+$/g, ""))
    .filter(Boolean)
}

export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter((token) => !STOPWORDS.has(token))
}

export function preprocessResumeText(text: string): PreprocessedResumeText {
  const normalized = normalizeForNlp(text)
  return {
    normalized,
    tokens: removeStopwords(tokenize(normalized)),
  }
}

export function isStopword(token: string): boolean {
  return STOPWORDS.has(token.toLowerCase())
}
