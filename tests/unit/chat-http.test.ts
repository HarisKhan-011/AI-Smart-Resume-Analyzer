import { describe, expect, it, jest } from "@jest/globals"
import { handleChatRequest, handleGetChatRequest } from "@/services/chat/chat-http"
import { ChatError } from "@/services/chat/chat-context"
import { ChatLlmError } from "@/services/chat/chat-llm"
import type { ChatConversation, ChatMessage } from "@/types/chat"

const user = { id: "507f1f77bcf86cd799439012", name: "Jane", role: "candidate" as const }
const conversationId = "507f1f77bcf86cd799439077"

function conversation(messages: ChatMessage[] = []): ChatConversation {
  return {
    id: conversationId,
    userId: user.id,
    messages,
    createdAt: new Date("2026-09-01"),
    updatedAt: new Date("2026-09-01"),
  }
}

describe("career chat API", () => {
  it("rejects unauthenticated history and send requests", async () => {
    expect((await handleGetChatRequest(null)).status).toBe(401)
    expect((await handleChatRequest(null, { message: "Hello" })).status).toBe(401)
  })

  it("returns stored conversation history for the signed-in user", async () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "How is my ATS score?", createdAt: new Date("2026-09-01T10:00:00Z") },
      { role: "assistant", content: "Your ATS score is 78/100.", createdAt: new Date("2026-09-01T10:00:01Z") },
    ]
    const load = jest.fn(async () => conversation(messages))
    const response = await handleGetChatRequest(user, load)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { conversationId: string; messages: ChatMessage[] }
    expect(body.conversationId).toBe(conversationId)
    expect(body.messages).toHaveLength(2)
    expect(load).toHaveBeenCalledWith(user.id)
  })

  it("sends a message and returns the assistant reply", async () => {
    const reply: ChatMessage = {
      role: "assistant",
      content: "Your saved match is missing TypeScript.",
      createdAt: new Date("2026-09-01T10:00:02Z"),
    }
    const send = jest.fn(async () => ({
      reply,
      conversation: conversation([
        { role: "user", content: "What skill should I learn?", createdAt: new Date("2026-09-01T10:00:01Z") },
        reply,
      ]),
    }))

    const response = await handleChatRequest(user, { message: "What skill should I learn?" }, {
      sendOwnedChatMessage: send,
    })

    expect(response.status).toBe(200)
    expect(send).toHaveBeenCalledWith(user.id, "What skill should I learn?", {
      name: "Jane",
      role: "candidate",
    })
    const body = (await response.json()) as { message: ChatMessage; messages: ChatMessage[] }
    expect(body.message.content).toContain("TypeScript")
    expect(body.messages).toHaveLength(2)
  })

  it("clears conversation history", async () => {
    const clear = jest.fn(async () => conversation([]))
    const response = await handleChatRequest(user, { reset: true }, {
      clearOwnedChatConversation: clear,
    })
    expect(response.status).toBe(200)
    expect(clear).toHaveBeenCalledWith(user.id)
    const body = (await response.json()) as { messages: ChatMessage[] }
    expect(body.messages).toEqual([])
  })

  it("maps empty-message validation errors", async () => {
    const send = jest.fn(async () => {
      throw new ChatError("A message is required.", 400, "EMPTY_MESSAGE")
    })
    const response = await handleChatRequest(user, { message: "   " }, { sendOwnedChatMessage: send })
    expect(response.status).toBe(400)
  })

  it("maps a missing LLM key to 503", async () => {
    const send = jest.fn(async () => {
      throw new ChatLlmError(
        "Career assistant is not configured. Set OPENAI_API_KEY on the server.",
        503,
        "LLM_NOT_CONFIGURED"
      )
    })
    const response = await handleChatRequest(user, { message: "Hello" }, { sendOwnedChatMessage: send })
    expect(response.status).toBe(503)
    const body = (await response.json()) as { code: string }
    expect(body.code).toBe("LLM_NOT_CONFIGURED")
  })
})
