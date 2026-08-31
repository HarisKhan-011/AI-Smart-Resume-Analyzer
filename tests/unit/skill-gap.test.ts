import { describe, expect, it } from "@jest/globals"
import { calculateSkillGap } from "@/services/skill-gap/skill-gap-service"
import { getLearningSuggestion } from "@/lib/learning-suggestions"

describe("skill gap analysis", () => {
  it("reports 67% coverage and required missing skills", () => {
    const result = calculateSkillGap({
      resumeSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
    })

    expect(result.coveragePercent).toBe(67)
    expect(result.matchedSkills).toEqual(["JavaScript", "React", "Node.js", "MongoDB"])
    expect(result.missingSkills).toEqual(["AWS", "Docker"])
    expect(result.recommendations.map((item) => item.skill)).toEqual(["AWS", "Docker"])
    expect(result.recommendations[0]?.suggestion).toBe("Learn AWS fundamentals")
    expect(result.recommendations[1]?.suggestion).toBe("Learn Docker basics")
  })

  it("includes preferred missing skills in recommendations", () => {
    const result = calculateSkillGap({
      resumeSkills: ["JavaScript"],
      requiredSkills: ["JavaScript", "React"],
      preferredSkills: ["AWS"],
    })

    expect(result.coveragePercent).toBe(50)
    expect(result.preferredMissingSkills).toEqual(["AWS"])
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ skill: "React", required: true }),
        expect.objectContaining({ skill: "AWS", required: false }),
      ])
    )
  })
})

describe("learning suggestions", () => {
  it("returns configured copy for known skills", () => {
    expect(getLearningSuggestion("AWS")).toBe("Learn AWS fundamentals")
    expect(getLearningSuggestion("docker")).toBe("Learn Docker basics")
  })

  it("falls back to a generic suggestion", () => {
    expect(getLearningSuggestion("Graph Databases")).toBe("Learn Graph Databases fundamentals")
  })
})
