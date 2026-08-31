import { describe, expect, it } from "@jest/globals"
import { extractSkills } from "@/services/nlp/skill-extractor"

describe("skill extraction", () => {
  it("maps JS to JavaScript", () => {
    const skills = extractSkills("Built UI features with JS and HTML")
    expect(skills.some((skill) => skill.name === "JavaScript")).toBe(true)
    expect(skills.find((skill) => skill.name === "JavaScript")?.confidence).toBe(0.9)
  })

  it("maps Node to Node.js", () => {
    const skills = extractSkills("Backend work in Node and Express")
    expect(skills.some((skill) => skill.name === "Node.js")).toBe(true)
    expect(skills.some((skill) => skill.name === "Express")).toBe(true)
  })

  it("maps ReactJS to React", () => {
    const skills = extractSkills("Frontend: ReactJS, Next.js, TypeScript")
    expect(skills.some((skill) => skill.name === "React")).toBe(true)
    expect(skills.find((skill) => skill.name === "React")?.category).toBe("Web Development")
  })

  it("does not treat JavaScript as Java", () => {
    const names = extractSkills("Strong JavaScript and TypeScript skills").map((skill) => skill.name)
    expect(names).toContain("JavaScript")
    expect(names).not.toContain("Java")
  })

  it("extracts categorized skills from resume text", () => {
    const skills = extractSkills(`
      Software Engineer skilled in JavaScript, React, Node.js, MongoDB, AWS, Docker, Git,
      Machine Learning, NLP, and teamwork.
    `)
    const names = skills.map((skill) => skill.name)

    expect(names).toEqual(
      expect.arrayContaining([
        "JavaScript",
        "React",
        "Node.js",
        "MongoDB",
        "AWS",
        "Docker",
        "Git",
        "Machine Learning",
        "NLP",
        "Teamwork",
      ])
    )
    expect(skills.every((skill) => skill.confidence >= 0.9)).toBe(true)
  })

  it("returns no skills for empty text", () => {
    expect(extractSkills("   ")).toEqual([])
  })
})
