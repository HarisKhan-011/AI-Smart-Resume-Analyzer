import { describe, expect, it } from "@jest/globals"
import { extractResumeSections } from "@/services/resume-improve/extract-resume-sections"
import { buildGroundedInterviewQuestions } from "@/services/interview-prep/build-questions"
import { evaluateAnswerLocally } from "@/services/interview-prep/evaluate-answer"
import type { InterviewQuestion } from "@/types/interview-prep"

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
  id: "resume-1",
  skills: ["JavaScript", "React", "Node.js"],
  experience: [{ company: "Acme Inc", position: "Software Engineer", startDate: "2022" }],
}

describe("grounded interview questions", () => {
  it("uses resume skills, roles, and projects without inventing missing skills", () => {
    const sections = extractResumeSections(sampleText, resume)
    const questions = buildGroundedInterviewQuestions({
      resume,
      sections,
      seed: 11,
      job: {
        title: "Frontend Developer",
        company: "Globex",
        requiredSkills: ["React", "Kubernetes"],
      },
    })

    const prompts = questions.map((question) => question.prompt).join(" ")
    expect(prompts).toMatch(/React/)
    expect(prompts).toMatch(/Acme Inc/)
    expect(prompts).toMatch(/Kubernetes/)
    expect(prompts).toMatch(/not on your resume/)
    expect(questions.some((question) => question.focus === "Kubernetes")).toBe(true)
    expect(questions.some((question) => question.category === "technical")).toBe(true)
    expect(questions.some((question) => question.category === "behavioral")).toBe(true)
    expect(questions.some((question) => question.category === "hr")).toBe(true)
    expect(questions.every((question) => ["easy", "medium", "hard"].includes(question.difficulty))).toBe(true)
  })

  it("returns a different set when generated again with a new seed", () => {
    const sections = extractResumeSections(sampleText, resume)
    const input = {
      resume,
      sections,
      job: {
        title: "Frontend Developer",
        company: "Globex",
        requiredSkills: ["React", "Kubernetes"],
      },
    }
    const first = buildGroundedInterviewQuestions({ ...input, seed: 11 })
    const second = buildGroundedInterviewQuestions({ ...input, seed: 99 })
    expect(first.map((question) => question.id).join("|")).not.toBe(
      second.map((question) => question.id).join("|")
    )
    expect(first.map((question) => question.prompt).join("|")).not.toBe(
      second.map((question) => question.prompt).join("|")
    )
  })
})

describe("local interview evaluation", () => {
  const question: InterviewQuestion = {
    id: "technical-0",
    category: "technical",
    difficulty: "medium",
    focus: "React",
    prompt: "Walk through a task from your resume that used React.",
  }

  it("scores an empty answer as 0", () => {
    const result = evaluateAnswerLocally({
      question,
      answer: "   ",
      resumeSkills: resume.skills,
      companies: ["Acme Inc"],
      resumeText: sampleText,
    })
    expect(result.score).toBe(0)
    expect(result.weaknesses[0]).toMatch(/empty/i)
  })

  it("penalizes invented numbers and claiming a missing skill", () => {
    const gapQuestion: InterviewQuestion = {
      id: "hr-2",
      category: "hr",
      difficulty: "hard",
      focus: "Kubernetes",
      prompt: "This job lists Kubernetes, which is not on your resume. How would you discuss that gap honestly?",
    }
    const result = evaluateAnswerLocally({
      question: gapQuestion,
      answer:
        "I used Kubernetes at Acme Inc and scaled it to 40,000 users because I led the cluster migration.",
      resumeSkills: resume.skills,
      companies: ["Acme Inc"],
      resumeText: sampleText,
    })
    expect(result.weaknesses.some((item) => /numbers/i.test(item))).toBe(true)
    expect(result.weaknesses.some((item) => /Kubernetes/i.test(item))).toBe(true)
    expect(result.score).toBeLessThan(70)
  })
})
