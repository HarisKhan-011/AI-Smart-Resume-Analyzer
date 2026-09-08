import {
  ResumeUploadError,
  sanitizeFileName,
  validateResumeUpload,
} from "@/lib/resume/file-validation"
import { extractResumeText } from "@/lib/resume/extract-text"
import { resumeFileStorage, type FileStorage } from "@/lib/storage/file-storage"
import { createResume } from "@/services/resume-service"
import { analyzeOwnedResume } from "@/services/resume-analysis-service"
import type { Resume as ResumeDTO } from "@/types/resume"

export type ProcessResumeUploadInput = {
  userId: string
  fileName: string
  mimeType: string
  size: number
  buffer: Buffer
}

export type ProcessResumeUploadResult = {
  id: string
  fileName: string
  fileType: string
  analysisStatus: string
  createdAt: Date
  textLength: number
}

type UploadDependencies = {
  storage: FileStorage
  saveResume: typeof createResume
  extractText: typeof extractResumeText
  analyzeResume?: typeof analyzeOwnedResume
}

const defaultDependencies: UploadDependencies = {
  storage: resumeFileStorage,
  saveResume: createResume,
  extractText: extractResumeText,
  analyzeResume: analyzeOwnedResume,
}

export async function processResumeUpload(
  input: ProcessResumeUploadInput,
  deps: UploadDependencies = defaultDependencies
): Promise<{ resume: ResumeDTO; result: ProcessResumeUploadResult }> {
  const fileType = validateResumeUpload({
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
    buffer: input.buffer,
  })

  const extractedText = await deps.extractText(input.buffer, fileType)
  const safeName = sanitizeFileName(input.fileName)
  const stored = await deps.storage.save({
    buffer: input.buffer,
    userId: input.userId,
    fileName: safeName,
    contentType: fileType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  const resume = await deps.saveResume({
    userId: input.userId,
    fileName: safeName,
    fileUrl: stored.url,
    fileType,
    extractedText,
    analysisStatus: "pending",
    atsAnalysisStatus: "pending",
  })

  const analyzeResume = deps.analyzeResume ?? analyzeOwnedResume
  let analyzedResume = resume
  try {
    const analyzed = await analyzeResume(resume.id, input.userId)
    analyzedResume = analyzed.resume
  } catch (error) {
    console.error("Automatic resume analysis failed", {
      resumeId: resume.id,
      userId: input.userId,
      error: error instanceof Error ? error.message : "unknown",
    })
  }

  return {
    resume: analyzedResume,
    result: {
      id: analyzedResume.id,
      fileName: analyzedResume.fileName,
      fileType: analyzedResume.fileType,
      analysisStatus: analyzedResume.analysisStatus,
      createdAt: analyzedResume.createdAt,
      textLength: extractedText.length,
    },
  }
}

export { ResumeUploadError }
