import { describe, expect, it } from "@jest/globals"
import { buildIndustryInsights } from "@/services/industry-insights/industry-insights-service"

describe("industry insights", () => {
  it("maps web skills to software engineering without inventing extra skills", () => {
    const result = buildIndustryInsights({
      resumeId: "507f1f77bcf86cd799439011",
      resumeFileName: "cv.pdf",
      skills: ["JavaScript", "React"],
      roleHints: ["Frontend Developer"],
    })

    expect(result).not.toBeNull()
    expect(result?.industryName).toBe("Software Engineering")
    expect(result?.skillCoverage.find((item) => item.skill === "JavaScript")?.present).toBe(true)
    expect(result?.skillCoverage.find((item) => item.skill === "TypeScript")?.present).toBe(false)
    expect(result?.typicalRoles).toContain("Frontend Developer")
    expect(JSON.stringify(result)).not.toMatch(/Google|Netflix|invented/i)
  })

  it("maps Python and ML skills to data and AI", () => {
    const result = buildIndustryInsights({
      resumeId: "507f1f77bcf86cd799439011",
      resumeFileName: "cv.pdf",
      skills: ["Python", "Machine Learning", "Pandas"],
    })

    expect(result?.industryName).toBe("Data & AI")
    expect(result?.outlook).toBe("Growing")
  })

  it("returns null when the resume has no extracted skills", () => {
    const result = buildIndustryInsights({
      resumeId: "507f1f77bcf86cd799439011",
      resumeFileName: "empty.pdf",
      skills: [],
    })

    expect(result).toBeNull()
  })
})
