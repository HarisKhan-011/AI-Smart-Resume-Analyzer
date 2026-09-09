export const INTERVIEW_CATEGORIES = ["technical", "behavioral", "hr"] as const
export type InterviewCategory = (typeof INTERVIEW_CATEGORIES)[number]

export const INTERVIEW_DIFFICULTIES = ["easy", "medium", "hard"] as const
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTIES)[number]

export type InterviewQuestion = {
  id: string
  category: InterviewCategory
  difficulty: InterviewDifficulty
  prompt: string
  focus: string
}

export type InterviewPrepResult = {
  resume: {
    id: string
    fileName: string
  }
  job: {
    id: string
    title: string
    company: string
  } | null
  usedLlm: boolean
  questions: InterviewQuestion[]
  notes: string[]
}

export type InterviewEvaluation = {
  questionId: string
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  feedback: string
}
