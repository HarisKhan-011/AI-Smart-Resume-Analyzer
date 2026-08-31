import { describe, expect, it } from "@jest/globals"
import { calculateMatch } from "@/services/matching/match-service"

describe("resume ↔ job skill matching", () => {
  it("scores 67% when 4 of 6 required skills match", () => {
    const result = calculateMatch({
      resumeSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
    })

    expect(result.overallScore).toBe(67)
    expect(result.skillScore).toBe(67)
    expect(result.matchedSkills).toEqual(["JavaScript", "React", "Node.js", "MongoDB"])
    expect(result.missingSkills).toEqual(["AWS", "Docker"])
  })

  it("matches skills case-insensitively without substring false positives", () => {
    const result = calculateMatch({
      resumeSkills: ["JavaScript"],
      requiredSkills: ["Java", "JavaScript"],
    })

    expect(result.matchedSkills).toEqual(["JavaScript"])
    expect(result.missingSkills).toEqual(["Java"])
    expect(result.overallScore).toBe(50)
  })

  it("reports preferred skills separately from required missing skills", () => {
    const result = calculateMatch({
      resumeSkills: ["JavaScript", "AWS"],
      requiredSkills: ["JavaScript", "React"],
      preferredSkills: ["AWS", "Docker"],
    })

    expect(result.matchedSkills).toEqual(["JavaScript"])
    expect(result.missingSkills).toEqual(["React"])
    expect(result.preferredMatchedSkills).toEqual(["AWS"])
    expect(result.preferredMissingSkills).toEqual(["Docker"])
    expect(result.overallScore).toBe(50)
  })
})
