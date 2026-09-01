/**
 * Swappable embedding backends for Phase 14.
 * Default: local Sentence Transformers Python service (AI_API_URL).
 * Alternate: Hugging Face Inference API (HF_TOKEN).
 */

export type EmbeddingProviderName = "python" | "huggingface"

export type SemanticAiConfig = {
  provider: "auto" | EmbeddingProviderName
  url: string
  apiKey: string
  hfToken: string
  hfUrl: string
  model: string
  timeoutMs: number
}

const DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
const DEFAULT_PYTHON_URL = "http://127.0.0.1:8001"
const DEFAULT_HF_URL = "https://api-inference.huggingface.co"

export function getSemanticAiConfig(): SemanticAiConfig {
  const providerRaw = (process.env.SEMANTIC_PROVIDER ?? "auto").trim().toLowerCase()
  const provider =
    providerRaw === "python" || providerRaw === "huggingface" ? providerRaw : "auto"

  return {
    provider,
    url: (process.env.AI_API_URL || process.env.SEMANTIC_AI_URL || "").trim(),
    apiKey: (process.env.AI_API_KEY || process.env.SEMANTIC_AI_KEY || "").trim(),
    hfToken: (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || "").trim(),
    hfUrl: (process.env.HF_API_URL || DEFAULT_HF_URL).trim().replace(/\/$/, ""),
    model: (process.env.SEMANTIC_MODEL || DEFAULT_MODEL).trim(),
    timeoutMs: Number(process.env.SEMANTIC_TIMEOUT_MS) || 10_000,
  }
}

export function resolveEmbeddingProvider(
  config: SemanticAiConfig = getSemanticAiConfig()
): EmbeddingProviderName | null {
  if (config.provider === "python") {
    return config.url ? "python" : null
  }
  if (config.provider === "huggingface") {
    return config.hfToken ? "huggingface" : null
  }
  if (config.url) return "python"
  if (config.hfToken) return "huggingface"
  return null
}

type EmbedFn = (texts: string[], config: SemanticAiConfig) => Promise<number[][]>

const providers: Record<EmbeddingProviderName, EmbedFn> = {
  python: embedWithPythonService,
  huggingface: embedWithHuggingFace,
}

export async function fetchEmbeddings(
  texts: string[],
  config: SemanticAiConfig = getSemanticAiConfig()
): Promise<number[][]> {
  const name = resolveEmbeddingProvider(config)
  if (!name) {
    throw new SemanticAiUnavailableError("No embedding provider is configured.")
  }
  return providers[name](texts, config)
}

export class SemanticAiUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SemanticAiUnavailableError"
  }
}

async function embedWithPythonService(
  texts: string[],
  config: SemanticAiConfig
): Promise<number[][]> {
  const base = (config.url || DEFAULT_PYTHON_URL).replace(/\/$/, "")
  const response = await timedFetch(`${base}/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey
        ? { Authorization: `Bearer ${config.apiKey}`, "X-API-Key": config.apiKey }
        : {}),
    },
    body: JSON.stringify({ texts }),
    timeoutMs: config.timeoutMs,
  })

  if (!response.ok) {
    throw new SemanticAiUnavailableError(`Python embedding service returned ${response.status}.`)
  }

  const body = (await response.json()) as { embeddings?: unknown }
  const embeddings = parseEmbeddingList(body.embeddings)
  if (embeddings.length < texts.length) {
    throw new SemanticAiUnavailableError("Python embedding service returned too few vectors.")
  }
  return embeddings
}

async function embedWithHuggingFace(
  texts: string[],
  config: SemanticAiConfig
): Promise<number[][]> {
  if (!config.hfToken) {
    throw new SemanticAiUnavailableError("HF_TOKEN is not configured.")
  }

  const url = `${config.hfUrl}/pipeline/feature-extraction/${config.model}`
  const response = await timedFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: texts,
      options: { wait_for_model: true },
    }),
    timeoutMs: config.timeoutMs,
  })

  if (!response.ok) {
    throw new SemanticAiUnavailableError(`Hugging Face returned ${response.status}.`)
  }

  const payload = (await response.json()) as unknown
  const embeddings = parseHuggingFaceEmbeddings(payload, texts.length)
  if (embeddings.length < texts.length) {
    throw new SemanticAiUnavailableError("Hugging Face returned too few vectors.")
  }
  return embeddings
}

async function timedFetch(
  url: string,
  init: RequestInit & { timeoutMs: number }
): Promise<Response> {
  const { timeoutMs, ...rest } = init
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...rest, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new SemanticAiUnavailableError("Embedding request timed out.")
    }
    throw new SemanticAiUnavailableError("Embedding service is unreachable.")
  } finally {
    clearTimeout(timer)
  }
}

function parseEmbeddingList(value: unknown): number[][] {
  if (!Array.isArray(value)) return []
  return value.map(meanPool).filter((vector) => vector.length > 0)
}

function parseHuggingFaceEmbeddings(payload: unknown, expected: number): number[][] {
  if (!Array.isArray(payload)) return []
  if (typeof payload[0] === "number") {
    return expected === 1 ? [meanPool(payload)] : []
  }
  return parseEmbeddingList(payload)
}

export function meanPool(value: unknown): number[] {
  if (!Array.isArray(value) || value.length === 0) return []
  if (typeof value[0] === "number") {
    return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
  }
  if (Array.isArray(value[0])) {
    const tokens = value.map(meanPool).filter((vector) => vector.length > 0)
    if (tokens.length === 0) return []
    const dim = tokens[0].length
    const sum = new Array<number>(dim).fill(0)
    for (const token of tokens) {
      if (token.length !== dim) continue
      for (let i = 0; i < dim; i += 1) sum[i] += token[i]
    }
    return sum.map((item) => item / tokens.length)
  }
  return []
}
