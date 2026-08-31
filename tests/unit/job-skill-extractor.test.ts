import { describe, expect, it } from "@jest/globals"
import { splitJobDescription } from "@/services/nlp/job-sections"
import { extractJobSkills } from "@/services/nlp/job-skill-extractor"

const sampleJob = `
We are hiring a software engineer to build web applications.

Requirements:
- JavaScript, ReactJS, and Node
- MongoDB
- Git

Preferred:
- AWS
- Docker
`

describe("job description skill extraction", () => {
  it("splits required and preferred sections", () => {
    const sections = splitJobDescription(sampleJob)
    expect(sections.required).toMatch(/JavaScript/)
    expect(sections.preferred).toMatch(/AWS/)
  })

  it("maps aliases and classifies required vs preferred skills", () => {
    const result = extractJobSkills(sampleJob)

    expect(result.requiredSkills).toEqual(
      expect.arrayContaining(["JavaScript", "React", "Node.js", "MongoDB", "Git"])
    )
    expect(result.preferredSkills).toEqual(expect.arrayContaining(["AWS", "Docker"]))
    expect(result.preferredSkills).not.toEqual(expect.arrayContaining(["JavaScript"]))
    expect(result.detectedSkills.some((skill) => skill.name === "React")).toBe(true)
  })

  it("treats skills as required when the description has no preferred section", () => {
    const result = extractJobSkills(
      "This role needs TypeScript, Next.js, and PostgreSQL experience for production services."
    )
    expect(result.requiredSkills).toEqual(
      expect.arrayContaining(["TypeScript", "Next.js", "PostgreSQL"])
    )
    expect(result.preferredSkills).toEqual([])
  })
})
