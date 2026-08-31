import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Resume, type ResumeDocument } from "@/models/resume"
import type { AnalysisStatus, Education, Resume as ResumeDTO, WorkExperience } from "@/types/resume"

export type CreateResumeInput = {
  userId: string
  fileName: string
  fileUrl: string
  fileType: string
  extractedText?: string
  skills?: string[]
  experience?: WorkExperience[]
  education?: Education[]
  analysisStatus?: AnalysisStatus
}

export type UpdateResumeInput = Partial<
  Omit<CreateResumeInput, "userId" | "fileName" | "fileUrl" | "fileType">
> & {
  fileName?: string
  fileUrl?: string
  fileType?: string
}

function toResumeDTO(resume: ResumeDocument): ResumeDTO {
  return {
    id: toStringId(resume._id),
    userId: toStringId(resume.userId),
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    fileType: resume.fileType,
    extractedText: resume.extractedText,
    skills: resume.skills ?? [],
    experience: resume.experience ?? [],
    education: resume.education ?? [],
    analysisStatus: resume.analysisStatus,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  }
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
    experience: input.experience ?? [],
    education: input.education ?? [],
    analysisStatus: input.analysisStatus ?? "pending",
  })
  return toResumeDTO(resume)
}

export async function getResumeById(id: string): Promise<ResumeDTO | null> {
  await dbConnect()
  const resume = await Resume.findById(id)
  return resume ? toResumeDTO(resume) : null
}

export async function listResumesByUser(userId: string): Promise<ResumeDTO[]> {
  await dbConnect()
  const resumes = await Resume.find({ userId }).sort({ createdAt: -1 })
  return resumes.map(toResumeDTO)
}

export async function updateResume(
  id: string,
  input: UpdateResumeInput
): Promise<ResumeDTO | null> {
  await dbConnect()
  const resume = await Resume.findByIdAndUpdate(id, input, { new: true })
  return resume ? toResumeDTO(resume) : null
}

export async function deleteResume(id: string): Promise<boolean> {
  await dbConnect()
  const result = await Resume.findByIdAndDelete(id)
  return Boolean(result)
}
