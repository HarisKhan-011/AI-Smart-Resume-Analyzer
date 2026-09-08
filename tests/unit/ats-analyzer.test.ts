import { describe, expect, it } from "@jest/globals"
import {
  ATS_WEIGHTS,
  analyzeResumeForAts,
  atsOverallStatus,
} from "@/services/ats/ats-analyzer"

const strongResume = `
Jane Candidate
jane.candidate@example.com
+1 415 555 0199
https://linkedin.com/in/janecandidate
https://github.com/janecandidate

Summary
Software engineer focused on web platforms, developer tooling, and reliable production systems.
I build customer-facing products with React and TypeScript and partner with design and data teams
to ship features that are easy to operate.

Experience
Software Engineer, Acme Inc
- Built customer dashboards with React and TypeScript used by 12,000 users
- Implemented CI pipelines that reduced release time by 35%
- Led migration of legacy APIs to Node.js and improved error rates
- Designed monitoring for checkout services and cut incident response time
- Collaborated with product managers to launch two billing experiments

Education
B.S. Computer Science, State University
Coursework in algorithms, databases, and distributed systems.

Skills
JavaScript, TypeScript, React, Node.js, MongoDB, AWS, Docker, Git

Projects
Resume analyzer — shipped a Next.js app that parses PDF resumes and highlights missing sections
Job matcher — compared extracted skills with job descriptions and ranked role fit

Certifications
AWS Certified Developer
`.trim()

describe("ATS analyzer", () => {
  it("scores a complete, parser-friendly resume highly", () => {
    const result = analyzeResumeForAts({
      text: strongResume,
      skills: [
        { name: "JavaScript", category: "Programming Languages" },
        { name: "TypeScript", category: "Programming Languages" },
        { name: "React", category: "Web Development" },
        { name: "Node.js", category: "Web Development" },
        { name: "MongoDB", category: "Databases" },
        { name: "AWS", category: "Cloud" },
        { name: "Docker", category: "DevOps" },
        { name: "Git", category: "Tools" },
      ],
    })

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.overallStatus).toBe("strong")
    expect(result.breakdown.contact).toBeGreaterThanOrEqual(80)
    expect(result.breakdown.sections).toBe(100)
    expect(result.breakdown.keywords).toBeGreaterThanOrEqual(75)
    expect(result.issues).toHaveLength(0)
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it("penalizes missing contact details and standard sections", () => {
    const result = analyzeResumeForAts({
      text: "Worked on some software things with computers.",
      skills: [],
    })

    expect(result.score).toBeLessThan(45)
    expect(result.overallStatus).toBe("poor")
    expect(result.issues.some((issue) => /email/i.test(issue))).toBe(true)
    expect(result.issues.some((issue) => /sections/i.test(issue))).toBe(true)
    expect(result.suggestions.some((item) => /skills/i.test(item))).toBe(true)
  })

  it("uses extracted skills for keyword coverage", () => {
    const withoutSkills = analyzeResumeForAts({
      text: strongResume,
      skills: [],
    })
    const withSkills = analyzeResumeForAts({
      text: strongResume,
      skills: ["JavaScript", "React", "TypeScript", "Node.js", "MongoDB", "AWS"],
    })

    expect(withSkills.breakdown.keywords).toBeGreaterThan(withoutSkills.breakdown.keywords)
    expect(withSkills.score).toBeGreaterThan(withoutSkills.score)
  })

  it("flags very short extracted text as an ATS parsing risk", () => {
    const result = analyzeResumeForAts({
      text: "Hi",
      skills: ["React"],
    })

    expect(result.breakdown.readability).toBeLessThan(60)
    expect(result.issues.some((issue) => /image-based|little text/i.test(issue))).toBe(true)
  })

  it("computes a transparent weighted score", () => {
    const result = analyzeResumeForAts({
      text: strongResume,
      skills: ["JavaScript", "React"],
    })
    const expected = Math.round(
      result.breakdown.contact * ATS_WEIGHTS.contact +
        result.breakdown.sections * ATS_WEIGHTS.sections +
        result.breakdown.keywords * ATS_WEIGHTS.keywords +
        result.breakdown.readability * ATS_WEIGHTS.readability +
        result.breakdown.experience * ATS_WEIGHTS.experience +
        result.breakdown.completeness * ATS_WEIGHTS.completeness
    )

    expect(result.score).toBe(expected)
    expect(atsOverallStatus(result.score)).toBe(result.overallStatus)
  })
})
