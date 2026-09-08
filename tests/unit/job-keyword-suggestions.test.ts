import { describe, expect, it } from "@jest/globals"
import { suggestJobKeywords } from "@/lib/job-keyword-suggestions"

describe("job keyword suggestions", () => {
  it("returns nothing until the user types a letter", () => {
    expect(suggestJobKeywords("")).toEqual([])
    expect(suggestJobKeywords("   ")).toEqual([])
  })

  it("suggests software and social roles when the user types so", () => {
    const suggestions = suggestJobKeywords("so")
    expect(suggestions[0]).toBe("software engineer")
    expect(suggestions).toEqual(
      expect.arrayContaining([
        "software engineer",
        "social media manager",
        "software developer",
        "soc analyst",
      ])
    )
    expect(suggestions).toHaveLength(10)
  })

  it("ranks prefix matches above later mentions", () => {
    const suggestions = suggestJobKeywords("soft")
    expect(suggestions[0]).toBe("software engineer")
    expect(suggestions.every((keyword) => keyword.toLowerCase().includes("soft"))).toBe(true)
  })
})
