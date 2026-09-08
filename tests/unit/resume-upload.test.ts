import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { ResumeUploadError, type ResumeFileType } from "@/lib/resume/file-validation"
import { processResumeUpload } from "@/services/resume-upload-service"
import type { AnalyzeResumeResult } from "@/services/resume-analysis-service"
import type { CreateResumeInput } from "@/services/resume-service"
import type { Resume } from "@/types/resume"

const pdfBuffer = Buffer.from("%PDF-1.4\nresume")
const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])

const extracted =
  "Jane Candidate\nSoftware Engineer\nBuilt web applications with React and Node.js."

function mockResume(fileType: "pdf" | "docx", overrides: Partial<Resume> = {}): Resume {
  return {
    id: "507f1f77bcf86cd799439011",
    userId: "507f1f77bcf86cd799439012",
    fileName: `resume.${fileType}`,
    fileUrl: "local://resumes/user/file",
    fileType,
    extractedText: extracted,
    skills: [],
    extractedSkills: [],
    experience: [],
    education: [],
    analysisStatus: "pending",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

function analyzedResult(fileType: "pdf" | "docx"): AnalyzeResumeResult {
  return {
    resume: mockResume(fileType, {
      analysisStatus: "completed",
      atsScore: 72,
      atsAnalysisStatus: "completed",
    }),
    skills: [],
    skillCount: 0,
    ats: null,
  }
}

describe("resume upload processing", () => {
  const saveResume = jest.fn(async (_input: CreateResumeInput): Promise<Resume> => mockResume("pdf"))
  const extractText = jest.fn(
    async (_buffer: Buffer, _fileType: ResumeFileType): Promise<string> => extracted
  )
  const storage = {
    save: jest.fn(async () => ({ key: "resumes/user/file", url: "local://resumes/user/file" })),
  }
  const analyzeResume = jest.fn(async (): Promise<AnalyzeResumeResult> => analyzedResult("pdf"))

  beforeEach(() => {
    saveResume.mockReset()
    extractText.mockReset()
    analyzeResume.mockReset()
    storage.save.mockClear()
    saveResume.mockResolvedValue(mockResume("pdf"))
    extractText.mockResolvedValue(extracted)
    analyzeResume.mockResolvedValue(analyzedResult("pdf"))
  })

  it("saves a pending resume document after a successful PDF upload", async () => {
    saveResume.mockResolvedValue(mockResume("pdf"))

    const { result } = await processResumeUpload(
      {
        userId: "507f1f77bcf86cd799439012",
        fileName: "../../secret.pdf",
        mimeType: "application/pdf",
        size: pdfBuffer.length,
        buffer: pdfBuffer,
      },
      { storage, saveResume, extractText, analyzeResume }
    )

    expect(extractText).toHaveBeenCalledWith(pdfBuffer, "pdf")
    expect(saveResume).toHaveBeenCalledTimes(1)
    expect(saveResume).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "507f1f77bcf86cd799439012",
        fileName: "secret.pdf",
        fileType: "pdf",
        extractedText: extracted,
        analysisStatus: "pending",
      })
    )
    expect(analyzeResume).toHaveBeenCalledWith("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012")
    expect(result.id).toBe("507f1f77bcf86cd799439011")
    expect(result.analysisStatus).toBe("completed")
  })

  it("uploads a DOCX and saves extracted text", async () => {
    saveResume.mockResolvedValue(mockResume("docx"))
    analyzeResume.mockResolvedValue(analyzedResult("docx"))

    await processResumeUpload(
      {
        userId: "507f1f77bcf86cd799439012",
        fileName: "resume.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: docxBuffer.length,
        buffer: docxBuffer,
      },
      { storage, saveResume, extractText, analyzeResume }
    )

    expect(extractText).toHaveBeenCalledWith(docxBuffer, "docx")
    expect(saveResume).toHaveBeenCalledWith(
      expect.objectContaining({
        fileType: "docx",
        analysisStatus: "pending",
      })
    )
  })

  it("rejects an empty extracted document", async () => {
    extractText.mockRejectedValue(
      new ResumeUploadError(
        "This document appears to be empty or could not be read.",
        400,
        "EMPTY_DOCUMENT"
      )
    )

    await expect(
      processResumeUpload(
        {
          userId: "507f1f77bcf86cd799439012",
          fileName: "empty.pdf",
          mimeType: "application/pdf",
          size: pdfBuffer.length,
          buffer: pdfBuffer,
        },
        { storage, saveResume, extractText }
      )
    ).rejects.toMatchObject({ code: "EMPTY_DOCUMENT" })

    expect(saveResume).not.toHaveBeenCalled()
  })

  it("does not save an invalid file type", async () => {
    await expect(
      processResumeUpload(
        {
          userId: "507f1f77bcf86cd799439012",
          fileName: "photo.png",
          mimeType: "image/png",
          size: 12,
          buffer: Buffer.from("not-a-resume"),
        },
        { storage, saveResume, extractText }
      )
    ).rejects.toBeInstanceOf(ResumeUploadError)

    expect(extractText).not.toHaveBeenCalled()
    expect(saveResume).not.toHaveBeenCalled()
  })

  it("still saves the resume if automatic ATS analysis fails", async () => {
    analyzeResume.mockRejectedValue(new Error("ats unavailable"))

    const { result } = await processResumeUpload(
      {
        userId: "507f1f77bcf86cd799439012",
        fileName: "resume.pdf",
        mimeType: "application/pdf",
        size: pdfBuffer.length,
        buffer: pdfBuffer,
      },
      { storage, saveResume, extractText, analyzeResume }
    )

    expect(saveResume).toHaveBeenCalledTimes(1)
    expect(result.analysisStatus).toBe("pending")
  })
})
