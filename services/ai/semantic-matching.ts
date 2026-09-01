import { roundScore } from "@/services/matching/score"
import {
  fetchEmbeddings,
  getSemanticAiConfig,
  resolveEmbeddingProvider,
  SemanticAiUnavailableError,
} from "@/services/ai/embedding-provider"

export type SemanticMatchResult = {
  semanticScore: number
  available: boolean
}

const MAX_CHARS = 6000

export function prepareSemanticText(text: string, maxChars = MAX_CHARS): string {
  return text.replace(/\s+/g, " ").trim().slice(0, maxChars)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0

  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i]
    const right = b[i]
    if (!Number.isFinite(left) || !Number.isFinite(right)) return 0
    dot += left * right
    magA += left * left
    magB += right * right
  }

  if (magA <= 0 || magB <= 0) return 0
  const similarity = dot / (Math.sqrt(magA) * Math.sqrt(magB))
  if (!Number.isFinite(similarity)) return 0
  return Math.max(-1, Math.min(1, similarity))
}

export function similarityToScore(similarity: number): number {
  return roundScore(Math.max(0, similarity) * 100)
}

/**
 * Sends resume and job text to the embedding service, computes cosine
 * similarity, and returns a 0–100 semantic score.
 * Failures resolve to available: false so skill matching can continue.
 */
export async function calculateSemanticScore(
  resumeText: string,
  jobText: string
): Promise<SemanticMatchResult> {
  const resume = prepareSemanticText(resumeText)
  const job = prepareSemanticText(jobText)
  const config = getSemanticAiConfig()

  if (!resume || !job || !resolveEmbeddingProvider(config)) {
    return { semanticScore: 0, available: false }
  }

  try {
    const [resumeEmbedding, jobEmbedding] = await fetchEmbeddings([resume, job], config)
    if (!resumeEmbedding?.length || !jobEmbedding?.length) {
      return { semanticScore: 0, available: false }
    }

    const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding)
    return {
      semanticScore: similarityToScore(similarity),
      available: true,
    }
  } catch (error) {
    if (!(error instanceof SemanticAiUnavailableError)) {
      console.warn("Semantic matching unavailable", {
        error: error instanceof Error ? error.message : "unknown",
      })
    } else {
      console.warn("Semantic matching unavailable", { error: error.message })
    }
    return { semanticScore: 0, available: false }
  }
}
