import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Resume, type ResumeDocument } from "@/models/resume"
import type {
  AnalysisStatus,
  AtsAnalysisStatus,
  AtsBreakdown,
  Education,
  ExtractedSkill,
  Resume as ResumeDTO,
  WorkExperience,
} from "@/types/resume"

export type ResumeSummary = Omit<ResumeDTO, "extractedText">

export type CreateResumeInput = {
  userId: string
  fileName: string
  fileUrl: string
  fileType: string
  extractedText?: string
  skills?: string[]
  extractedSkills?: ExtractedSkill[]
  experience?: WorkExperience[]
  education?: Education[]
  analysisStatus?: AnalysisStatus
  atsScore?: number | null
  atsBreakdown?: AtsBreakdown | null
  atsIssues?: string[]
  atsSuggestions?: string[]
  atsStrengths?: string[]
  atsAnalysisStatus?: AtsAnalysisStatus
}

export type UpdateResumeInput = Partial<
  Omit<CreateResumeInput, "userId" | "fileName" | "fileUrl" | "fileType">
> & {
  fileName?: string
  fileUrl?: string
  fileType?: string
}

function toResumeDTO(resume: ResumeDocument, includeText = false): ResumeDTO {
  return {
    id: toStringId(resume._id),
    userId: toStringId(resume.userId),
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    fileType: resume.fileType,
    extractedText: includeText ? resume.extractedText ?? "" : undefined,
    skills: resume.skills ?? [],
    extractedSkills: (resume.extractedSkills ?? []).map((skill) => ({
      name: skill.name,
      category: skill.category,
      confidence: skill.confidence,
    })),
    experience: resume.experience ?? [],
    education: resume.education ?? [],
    analysisStatus: resume.analysisStatus,
    atsScore: resume.atsScore ?? null,
    atsBreakdown: resume.atsBreakdown
      ? {
          contact: resume.atsBreakdown.contact ?? 0,
          sections: resume.atsBreakdown.sections ?? 0,
          keywords: resume.atsBreakdown.keywords ?? 0,
          readability: resume.atsBreakdown.readability ?? 0,
          experience: resume.atsBreakdown.experience ?? 0,
          completeness: resume.atsBreakdown.completeness ?? 0,
        }
      : null,
    atsIssues: resume.atsIssues ?? [],
    atsSuggestions: resume.atsSuggestions ?? [],
    atsStrengths: resume.atsStrengths ?? [],
    atsAnalysisStatus: resume.atsAnalysisStatus ?? "pending",
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  }
}

function toResumeSummary(resume: ResumeDocument): ResumeSummary {
  const dto = toResumeDTO(resume, false)
  const { extractedText: _extractedText, ...summary } = dto
  return summary
}

export async function createResume(input: CreateResumeInput): Promise<ResumeDTO> {
  await dbConnect()
  const resume = await Resume.create({
    userId: input.userId,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    fileType: input.fileType,
    extractedText: input.extractedText ?? "",
    skills: input.skills ?? [],
    extractedSkills: input.extractedSkills ?? [],
    experience: input.experience ?? [],
    education: input.education ?? [],
    analysisStatus: input.analysisStatus ?? "pending",
    atsScore: input.atsScore ?? null,
    atsBreakdown: input.atsBreakdown ?? null,
    atsIssues: input.atsIssues ?? [],
    atsSuggestions: input.atsSuggestions ?? [],
    atsStrengths: input.atsStrengths ?? [],
    atsAnalysisStatus: input.atsAnalysisStatus ?? "pending",
  })
  return toResumeDTO(resume, true)
}

export async function getResumeById(id: string): Promise<ResumeDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const resume = await Resume.findById(id).select("+extractedText")
  return resume ? toResumeDTO(resume, true) : null
}

export function ownedResumeFilter(id: string, userId: string) {
  return { _id: id, userId }
}

export async function getOwnedResume(
  id: string,
  userId: string
): Promise<ResumeDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const resume = await Resume.findOne(ownedResumeFilter(id, userId)).select("+extractedText")
  return resume ? toResumeDTO(resume, true) : null
}

export async function listResumesByUser(userId: string): Promise<ResumeSummary[]> {
  await dbConnect()
  const resumes = await Resume.find({ userId }).sort({ createdAt: -1 })
  return resumes.map(toResumeSummary)
}

export async function updateResume(
  id: string,
  input: UpdateResumeInput
): Promise<ResumeDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const resume = await Resume.findByIdAndUpdate(id, input, { new: true })
  return resume ? toResumeDTO(resume, false) : null
}

export async function updateOwnedResume(
  id: string,
  userId: string,
  input: UpdateResumeInput
): Promise<ResumeDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const resume = await Resume.findOneAndUpdate(ownedResumeFilter(id, userId), input, {
    new: true,
  })
  return resume ? toResumeDTO(resume, false) : null
}

export async function deleteResume(id: string, userId?: string): Promise<boolean> {
  if (!isValidObjectId(id)) return false
  await dbConnect()
  const filter = userId ? { _id: id, userId } : { _id: id }
  const result = await Resume.findOneAndDelete(filter)
  return Boolean(result)
}
