import { describe, expect, it, jest } from "@jest/globals"
import { sendOwnedChatMessage, validateChatMessage, SYSTEM_PROMPT } from "@/services/chat/chat-service"
import { ChatError } from "@/services/chat/chat-context"
import { ChatLlmError } from "@/services/chat/chat-llm"
import type { ChatLlmMessage } from "@/services/chat/chat-llm"
import type { CareerChatContext, ChatConversation, ChatMessage } from "@/types/chat"

const userId = "507f1f77bcf86cd799439012"

const emptyContext: CareerChatContext = {
  missingDataNotes: ["The user has not uploaded a resume."],
  user: { name: "Jane", role: "candidate" },
  resume: null,
  jobMatches: [],
  skillGaps: { missingSkills: [], learningSuggestions: [] },
  applications: [],
  recommendedJobs: [],
}

describe("career chat service", () => {
  it("rejects empty messages before calling the model", () => {
    expect(() => validateChatMessage("   ")).toThrow(ChatError)
  })

  it("instructs the model not to invent facts", () => {
    expect(SYSTEM_PROMPT).toMatch(/Never invent/i)
    expect(SYSTEM_PROMPT).toMatch(/only source of facts|ONLY the JSON/i)
  })

  it("persists the user message and assistant reply", async () => {
    const conversation: ChatConversation = {
      id: "507f1f77bcf86cd799439077",
      userId,
      messages: [],
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    }
    const completeChat = jest.fn(async (_messages: ChatLlmMessage[]) => "Upload a resume so I can use your actual skills.")
    const saveMessages = jest.fn(async (_id: string, messages: ChatMessage[]) => ({
      ...conversation,
      messages,
    }))

    const result = await sendOwnedChatMessage(
      userId,
      "What job should I apply to?",
      { name: "Jane", role: "candidate" },
      {
        getOwnedChatConversation: jest.fn(async () => conversation),
        buildCareerChatContext: jest.fn(async () => emptyContext),
        completeChat,
        saveMessages,
      }
    )

    expect(completeChat).toHaveBeenCalled()
    const llmMessages = completeChat.mock.calls[0]?.[0] ?? []
    expect(llmMessages.some((item) => item.role === "system" && /has not uploaded a resume/i.test(item.content))).toBe(
      true
    )
    expect(result.reply.content).toContain("Upload a resume")
    expect(result.conversation.messages).toHaveLength(2)
    expect(result.conversation.messages[0]?.role).toBe("user")
    expect(result.conversation.messages[1]?.role).toBe("assistant")
  })

  it("falls back to stored career data when no LLM key is configured", async () => {
    const conversation: ChatConversation = {
      id: "507f1f77bcf86cd799439077",
      userId,
      messages: [],
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    }
    const completeChat = jest.fn(async () => {
      throw new ChatLlmError(
        "Career assistant is not configured. Set OPENAI_API_KEY on the server.",
        503,
        "LLM_NOT_CONFIGURED"
      )
    })
    const saveMessages = jest.fn(async (_id: string, messages: ChatMessage[]) => ({
      ...conversation,
      messages,
    }))

    const result = await sendOwnedChatMessage(
      userId,
      "What should I do with my applications?",
      { name: "Jane", role: "candidate" },
      {
        getOwnedChatConversation: jest.fn(async () => conversation),
        buildCareerChatContext: jest.fn(async () => emptyContext),
        completeChat,
        saveMessages,
      }
    )

    expect(result.reply.content).toMatch(/no tracked applications/i)
    expect(result.conversation.messages).toHaveLength(2)
  })
})
