export type ChatRole = "user" | "assistant"

export type ChatMessage = {
  role: ChatRole
  content: string
  createdAt: Date | string
}

export type ChatConversation = {
  id: string
  userId: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export type CareerChatResumeContext = {
  id: string
  fileName: string
  analysisStatus: string
  skills: string[]
  atsScore: number | null
  atsBreakdown: {
    contact: number
    sections: number
    keywords: number
    readability: number
    experience: number
    completeness: number
  } | null
  atsIssues: string[]
  atsSuggestions: string[]
  atsStrengths: string[]
  atsAnalysisStatus: string
  experience: Array<{ position: string; company: string }>
  education: Array<{ degree: string; field: string; institution: string }>
  resumeExcerpt: string | null
}

export type CareerChatMatchContext = {
  jobTitle: string | null
  company: string | null
  overallScore: number
  skillScore: number
  matchedSkills: string[]
  missingSkills: string[]
}

export type CareerChatApplicationContext = {
  status: string
  jobTitle: string | null
  company: string | null
  matchScore: number | null
  notes: string
}

export type CareerChatRecommendationContext = {
  title: string
  company: string
  location: string
  overallScore: number
  matchedSkills: string[]
  missingSkills: string[]
}

export type CareerChatContext = {
  missingDataNotes: string[]
  user: {
    name: string | null
    role: string
  }
  resume: CareerChatResumeContext | null
  jobMatches: CareerChatMatchContext[]
  skillGaps: {
    missingSkills: string[]
    learningSuggestions: Array<{ skill: string; suggestion: string }>
  }
  applications: CareerChatApplicationContext[]
  recommendedJobs: CareerChatRecommendationContext[]
}
