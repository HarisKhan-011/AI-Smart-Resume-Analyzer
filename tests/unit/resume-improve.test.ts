import { describe, expect, it } from "@jest/globals"
import { extractResumeSections } from "@/services/resume-improve/extract-resume-sections"
import {
  filterSkillsToKnown,
  hasInventedNumbers,
  rewriteSectionsLocally,
  sanitizeLlmSections,
} from "@/services/resume-improve/rewrite-resume-sections"

const sampleText = `
Jane Candidate
jane@example.com

Summary
Software engineer focused on React dashboards.

Experience
Software Engineer, Acme Inc
- Built customer dashboards with React
- Implemented CI pipelines

Projects
Resume parser — shipped a Next.js app that parses PDF resumes

Skills
JavaScript, React, Node.js
`.trim()

const resume = {
  skills: ["JavaScript", "React", "Node.js"],
  experience: [{ company: "Acme Inc", position: "Software Engineer", startDate: "2022" }],
}

describe("resume section extraction", () => {
  it("reads summary, experience, projects, and skills from extracted text", () => {
    const sections = extractResumeSections(sampleText, resume)
    expect(sections.summary).toMatch(/React dashboards/i)
    expect(sections.experience).toMatch(/Acme Inc/)
    expect(sections.projects).toMatch(/Resume parser/)
    expect(sections.skills).toMatch(/JavaScript/)
  })
})

describe("truthful resume rewrites", () => {
  it("does not add skills that are not already on the resume", () => {
    const original = extractResumeSections(sampleText, resume)
    const improved = rewriteSectionsLocally({
      original,
      resumeSkills: resume.skills,
      jobRequiredSkills: ["Kubernetes", "React"],
    })
    expect(improved.skills).toMatch(/React/)
    expect(improved.skills).not.toMatch(/Kubernetes/)
  })

  it("does not introduce numbers that were not in the original text", () => {
    expect(hasInventedNumbers("Built dashboards with React", "Built dashboards for 12,000 users")).toBe(true)
    expect(hasInventedNumbers("Reduced time by 35%", "Reduced release time by 35%")).toBe(false)
  })

  it("drops invented LLM skills and numbers", () => {
    const original = extractResumeSections(sampleText, resume)
    const sanitized = sanitizeLlmSections({
      original,
      resumeSkills: resume.skills,
      proposed: {
        summary: "Software engineer focused on React dashboards.",
        experience: "Led a team of 40 engineers at Google.",
        skills: "React, Kubernetes",
      },
    })
    expect(sanitized.experience).not.toMatch(/Google|40/)
    expect(sanitized.skills).not.toMatch(/Kubernetes/)
    expect(sanitized.skills).toMatch(/React/)
  })

  it("keeps known skills when filtering", () => {
    expect(filterSkillsToKnown("React, Kubernetes", "JavaScript React Node.js")).toBe("React")
  })
})
