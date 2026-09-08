export type AnalysisStatus = "pending" | "processing" | "completed" | "failed"

export type AtsAnalysisStatus = "pending" | "processing" | "completed" | "failed"

export type AtsBreakdown = {
  contact: number
  sections: number
  keywords: number
  readability: number
  experience: number
  completeness: number
}

export interface WorkExperience {
  company: string
  position: string
  startDate: string
  endDate?: string
  description?: string
}

export interface Education {
  institution: string
  degree: string
  field: string
  graduationYear: string
}

export interface ExtractedSkill {
  name: string
  category: string
  confidence: number
}

export interface ParsedResumeData {
  skills: string[]
  experience: WorkExperience[]
  education: Education[]
  summary?: string
}

export interface Resume {
  id: string
  userId: string
  fileName: string
  fileUrl: string
  fileType: string
  extractedText?: string
  skills: string[]
  extractedSkills: ExtractedSkill[]
  experience: WorkExperience[]
  education: Education[]
  analysisStatus: AnalysisStatus
  atsScore?: number | null
  atsBreakdown?: AtsBreakdown | null
  atsIssues?: string[]
  atsSuggestions?: string[]
  atsStrengths?: string[]
  atsAnalysisStatus?: AtsAnalysisStatus
  createdAt: Date
  updatedAt: Date
}
