import { describe, expect, it } from "@jest/globals"
import { isCareerAssistantTopic } from "@/services/chat/career-topic"

const history = [
  { role: "user", content: "How ATS-friendly is my current resume?" },
  { role: "assistant", content: "Your ATS-oriented score is 78/100." },
]

describe("career assistant topic gate", () => {
  it("allows typed career questions that are not the suggestion chips", () => {
    expect(isCareerAssistantTopic("How can I improve my resume?")).toBe(true)
    expect(isCareerAssistantTopic("Help me prep for interviews")).toBe(true)
    expect(isCareerAssistantTopic("What should my career roadmap be?")).toBe(true)
    expect(isCareerAssistantTopic("how can we improve that", history)).toBe(true)
  })

  it("refuses off-topic and chit-chat", () => {
    expect(isCareerAssistantTopic("lol", history)).toBe(false)
    expect(isCareerAssistantTopic("What is the weather in Lahore today?")).toBe(false)
    expect(isCareerAssistantTopic("Write me a poem about cricket")).toBe(false)
  })
})
