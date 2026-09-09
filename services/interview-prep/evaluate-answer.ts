import type { InterviewEvaluation, InterviewQuestion } from "@/types/interview-prep"
import { extractNumbers } from "@/services/resume-improve/rewrite-resume-sections"

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function mentions(haystack: string, needle: string): boolean {
  const value = needle.trim()
  if (value.length < 2) return false
  return haystack.toLowerCase().includes(value.toLowerCase())
}

export function evaluateAnswerLocally(input: {
  question: InterviewQuestion
  answer: string
  resumeSkills: string[]
  companies: string[]
  resumeText: string
}): InterviewEvaluation {
  const answer = input.answer.trim()
  const strengths: string[] = []
  const weaknesses: string[] = []
  const suggestions: string[] = []
  let score = 0

  if (!answer) {
    return {
      questionId: input.question.id,
      score: 0,
      strengths: [],
      weaknesses: ["The answer is empty."],
      suggestions: ["Write a specific answer using only experience and skills already on your resume."],
      feedback: "There is no answer to evaluate yet.",
    }
  }

  if (answer.length < 40) {
    score += 18
    weaknesses.push("The answer is very short, so it is hard to assess depth.")
    suggestions.push("Add a concrete example from a role or project that is already on your resume.")
  } else if (answer.length < 120) {
    score += 40
  } else {
    score += 55
    strengths.push("The answer has enough length to explain a real example.")
  }

  if (mentions(answer, input.question.focus)) {
    score += 12
    strengths.push(`The answer stays on the question focus: ${input.question.focus}.`)
  } else {
    weaknesses.push(`The answer never mentions the question focus (${input.question.focus}).`)
    suggestions.push(`Tie the story back to ${input.question.focus} using only facts from your resume.`)
  }

  const usedSkills = input.resumeSkills.filter((skill) => mentions(answer, skill))
  if (usedSkills.length) {
    score += 10
    strengths.push(`The answer uses documented skills: ${usedSkills.slice(0, 4).join(", ")}.`)
  }

  const usedCompanies = input.companies.filter((company) => mentions(answer, company))
  if (usedCompanies.length) {
    score += 8
    strengths.push(`The answer refers to listed experience: ${usedCompanies.slice(0, 3).join(", ")}.`)
  }

  if (/\b(situation|task|action|result|because|i led|i built|i implemented)\b/i.test(answer)) {
    score += 8
    strengths.push("The answer uses a structured, first-person explanation.")
  } else {
    suggestions.push("Use a simple STAR structure: situation, task, action, result — only with facts you can support.")
  }

  const inventedNumbers = [...extractNumbers(answer)].filter(
    (value) => !extractNumbers(input.resumeText).has(value)
  )
  if (inventedNumbers.length) {
    score -= 12
    weaknesses.push("The answer includes numbers that are not in your resume text.")
    suggestions.push("Only quantify results that already appear on your resume, or omit the number.")
  }

  if (input.question.prompt.toLowerCase().includes("not on your resume") && mentions(answer, input.question.focus)) {
    score -= 15
    weaknesses.push(`The answer treats ${input.question.focus} as existing experience, but it is not on your resume.`)
    suggestions.push("Discuss the gap honestly and describe a learning plan instead of claiming the skill.")
  }

  const finalScore = clampScore(score)
  const feedback =
    finalScore >= 75
      ? "This is a solid answer grounded in your resume. Tighten one example and stop there."
      : finalScore >= 50
        ? "The direction is usable. Add one resume-backed example and remove anything you cannot document."
        : "Rewrite this using a specific role, skill, or project that is already on your resume."

  return {
    questionId: input.question.id,
    score: finalScore,
    strengths: [...new Set(strengths)],
    weaknesses: [...new Set(weaknesses)],
    suggestions: [...new Set(suggestions)],
    feedback,
  }
}

