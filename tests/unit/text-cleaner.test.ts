import { describe, expect, it } from "@jest/globals"
import { cleanExtractedText, isExtractedTextUsable } from "@/lib/resume/text-cleaner"

describe("extracted text cleaning", () => {
  it("normalizes line breaks and extra whitespace", () => {
    const cleaned = cleanExtractedText("Name:\r\n\r\n\r\nJohn   Doe\fExperience")
    expect(cleaned).toBe("Name:\n\nJohn Doe\nExperience")
  })

  it("removes pdf extraction artifacts", () => {
    const cleaned = cleanExtractedText("Skills (cid:12) React")
    expect(cleaned).toBe("Skills React")
  })

  it("treats empty or artifact-only text as unusable", () => {
    expect(isExtractedTextUsable("")).toBe(false)
    expect(isExtractedTextUsable("\n\n   ")).toBe(false)
    expect(isExtractedTextUsable("John Doe\nSoftware Engineer with five years of experience")).toBe(true)
  })
})
