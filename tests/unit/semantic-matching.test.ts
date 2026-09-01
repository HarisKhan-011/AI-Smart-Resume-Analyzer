import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals"
import { combineSkillAndSemanticScores } from "@/services/matching/score"
import {
  cosineSimilarity,
  prepareSemanticText,
  similarityToScore,
  calculateSemanticScore,
} from "@/services/ai/semantic-matching"
import { meanPool, resolveEmbeddingProvider } from "@/services/ai/embedding-provider"

describe("semantic similarity math", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
  })

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it("returns 0 for mismatched or empty vectors", () => {
    expect(cosineSimilarity([], [1])).toBe(0)
    expect(cosineSimilarity([1, 2], [1])).toBe(0)
  })

  it("maps cosine similarity onto a 0–100 score", () => {
    expect(similarityToScore(0.8)).toBe(80)
    expect(similarityToScore(-0.2)).toBe(0)
    expect(similarityToScore(1.4)).toBe(100)
  })

  it("mean-pools token embeddings into a single vector", () => {
    expect(meanPool([[2, 0], [0, 2]])).toEqual([1, 1])
    expect(meanPool([0.5, 0.5])).toEqual([0.5, 0.5])
  })

  it("trims and truncates text before embedding", () => {
    expect(prepareSemanticText("  Hello   world  ", 8)).toBe("Hello wo")
  })
})

describe("combined match score", () => {
  it("uses 60% skill + 40% semantic when AI is available", () => {
    const result = combineSkillAndSemanticScores(92, 80, true)
    expect(result).toEqual({
      skillScore: 92,
      semanticScore: 80,
      overallScore: 87,
    })
  })

  it("falls back to skill match when semantic AI is unavailable", () => {
    const result = combineSkillAndSemanticScores(67, 80, false)
    expect(result).toEqual({
      skillScore: 67,
      semanticScore: 0,
      overallScore: 67,
    })
  })
})

describe("calculateSemanticScore fallback", () => {
  const keys = [
    "SEMANTIC_PROVIDER",
    "AI_API_URL",
    "SEMANTIC_AI_URL",
    "HF_TOKEN",
    "HUGGINGFACE_API_KEY",
  ] as const
  const previous: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of keys) previous[key] = process.env[key]
    process.env.SEMANTIC_PROVIDER = "auto"
    process.env.AI_API_URL = ""
    process.env.SEMANTIC_AI_URL = ""
    process.env.HF_TOKEN = ""
    process.env.HUGGINGFACE_API_KEY = ""
  })

  afterEach(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  })

  it("skips the network when no provider is configured", async () => {
    const fetchSpy = jest.spyOn(global, "fetch")
    const result = await calculateSemanticScore("resume about react", "job needs react")
    expect(result).toEqual({ semanticScore: 0, available: false })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it("returns unavailable when the embedding service fails", async () => {
    process.env.AI_API_URL = "http://127.0.0.1:59999"
    const fetchSpy = jest.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"))
    const result = await calculateSemanticScore("resume about react", "job needs react")
    expect(result.available).toBe(false)
    expect(result.semanticScore).toBe(0)
    fetchSpy.mockRestore()
  })

  it("computes a score from returned embeddings", async () => {
    process.env.AI_API_URL = "http://127.0.0.1:8001"
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [[1, 0], [0.8, 0.6]] }),
    } as Response)

    const result = await calculateSemanticScore("resume about react", "job needs react")
    expect(result.available).toBe(true)
    expect(result.semanticScore).toBe(similarityToScore(cosineSimilarity([1, 0], [0.8, 0.6])))
    fetchSpy.mockRestore()
  })

  it("selects the python provider when AI_API_URL is set", () => {
    expect(
      resolveEmbeddingProvider({
        provider: "auto",
        url: "http://127.0.0.1:8001",
        apiKey: "",
        hfToken: "",
        hfUrl: "https://api-inference.huggingface.co",
        model: "sentence-transformers/all-MiniLM-L6-v2",
        timeoutMs: 1000,
      })
    ).toBe("python")
  })
})
