export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "freelance"
  | "temporary"

export type JobSource = "manual" | "api" | "scrape"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requiredSkills: string[]
  preferredSkills: string[]
  employmentType: EmploymentType
  source: JobSource
  sourceUrl?: string | null
  postedDate: Date
  isPosted?: boolean
  isActive?: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
}
