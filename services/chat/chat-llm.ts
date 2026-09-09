import { config } from "@/lib/config"

export class ChatLlmError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 502, code = "LLM_ERROR") {
    super(message)
    this.name = "ChatLlmError"
    this.status = status
    this.code = code
  }
}

export type ChatLlmConfig = {
  apiKey: string
  baseUrl: string
  model: string
  timeoutMs: number
}

export type ChatLlmMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export function getChatLlmConfig(): ChatLlmConfig {
  return {
    apiKey: (process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "").trim(),
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/$/, ""),
    model: (process.env.OPENAI_MODEL || process.env.LLM_MODEL || "gpt-4o-mini").trim(),
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || config.chat.timeoutMs,
  }
}

export function isChatLlmConfigured(llmConfig: ChatLlmConfig = getChatLlmConfig()): boolean {
  return Boolean(llmConfig.apiKey)
}

type ChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
  error?: {
    message?: string
  }
}

export async function completeChat(
  messages: ChatLlmMessage[],
  llmConfig: ChatLlmConfig = getChatLlmConfig(),
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  if (!llmConfig.apiKey) {
    throw new ChatLlmError(
      "Career assistant is not configured. Set OPENAI_API_KEY on the server.",
      503,
      "LLM_NOT_CONFIGURED"
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), llmConfig.timeoutMs)

  try {
    const response = await fetchImpl(`${llmConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmConfig.model,
        temperature: 0.2,
        messages,
      }),
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as ChatCompletionsResponse | null
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ChatLlmError(
          "Career assistant could not authenticate with the AI provider.",
          502,
          "LLM_AUTH"
        )
      }
      if (response.status === 429) {
        throw new ChatLlmError(
          "The career assistant is busy. Please try again shortly.",
          429,
          "LLM_RATE_LIMIT"
        )
      }
      throw new ChatLlmError(
        "Career assistant is temporarily unavailable. Please try again.",
        502,
        "LLM_UNAVAILABLE"
      )
    }

    const content = payload?.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new ChatLlmError(
        "The career assistant returned an empty reply. Please try again.",
        502,
        "LLM_EMPTY"
      )
    }

    return content
  } catch (error) {
    if (error instanceof ChatLlmError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw new ChatLlmError("The career assistant timed out. Please try again.", 504, "LLM_TIMEOUT")
    }
    throw new ChatLlmError(
      "Career assistant is temporarily unavailable. Please try again.",
      502,
      "LLM_UNAVAILABLE"
    )
  } finally {
    clearTimeout(timeout)
  }
}
