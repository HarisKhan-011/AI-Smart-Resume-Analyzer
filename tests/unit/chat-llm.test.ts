import { describe, expect, it, jest } from "@jest/globals"
import { completeChat, ChatLlmError } from "@/services/chat/chat-llm"

describe("career chat LLM provider", () => {
  it("fails closed when no server API key is configured", async () => {
    await expect(
      completeChat([{ role: "user", content: "Hello" }], {
        apiKey: "",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini",
        timeoutMs: 1000,
      })
    ).rejects.toMatchObject({
      name: "ChatLlmError",
      code: "LLM_NOT_CONFIGURED",
      status: 503,
    })
  })

  it("does not include the API key in error messages", async () => {
    const fetchImpl = jest.fn(async () =>
      new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 })
    ) as unknown as typeof fetch

    await expect(
      completeChat([{ role: "user", content: "Hello" }], {
        apiKey: "sk-secret-test-key",
        baseUrl: "https://example.test/v1",
        model: "gpt-4o-mini",
        timeoutMs: 1000,
      }, fetchImpl)
    ).rejects.toEqual(
      expect.objectContaining({
        name: "ChatLlmError",
        message: expect.not.stringContaining("sk-secret-test-key"),
      })
    )
  })

  it("returns the assistant message from an OpenAI-compatible response", async () => {
    const fetchImpl = jest.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Focus on the missing React skill from your matches." } }],
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch

    const reply = await completeChat(
      [{ role: "user", content: "What should I learn?" }],
      {
        apiKey: "sk-test",
        baseUrl: "https://example.test/v1",
        model: "gpt-4o-mini",
        timeoutMs: 1000,
      },
      fetchImpl
    )

    expect(reply).toBe("Focus on the missing React skill from your matches.")
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
      })
    )
  })

  it("maps provider failures without leaking internals", async () => {
    const fetchImpl = jest.fn(async () => new Response("nope", { status: 500 })) as unknown as typeof fetch

    await expect(
      completeChat([{ role: "user", content: "Hello" }], {
        apiKey: "sk-test",
        baseUrl: "https://example.test/v1",
        model: "gpt-4o-mini",
        timeoutMs: 1000,
      }, fetchImpl)
    ).rejects.toBeInstanceOf(ChatLlmError)
  })
})
