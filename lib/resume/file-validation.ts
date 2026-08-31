export type ResumeFileType = "pdf" | "docx"

export class ResumeUploadError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "UPLOAD_ERROR") {
    super(message)
    this.name = "ResumeUploadError"
    this.status = status
    this.code = code
  }
}

export const PDF_MIME = "application/pdf"
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export const ALLOWED_RESUME_MIME_TYPES = [PDF_MIME, DOCX_MIME] as const
export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx"] as const
export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024
export const MIN_EXTRACTED_TEXT_LENGTH = 30

export function getFileExtension(fileName: string): string {
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? ""
  const dot = base.lastIndexOf(".")
  if (dot < 0) return ""
  return base.slice(dot).toLowerCase()
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? "resume"
  const cleaned = base
    .replace(/[^\w.\- ()]/g, "_")
    .replace(/_{2,}/g, "_")
    .trim()
    .slice(0, 120)
  return cleaned || "resume"
}

export function detectResumeFileType(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): ResumeFileType {
  const extension = getFileExtension(fileName)
  const mime = mimeType.toLowerCase()
  const isPdfMagic = buffer.subarray(0, 5).toString("utf8") === "%PDF-"
  const isZipMagic = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b

  if (extension === ".doc" || mime === "application/msword") {
    throw new ResumeUploadError("Only PDF and DOCX files are allowed.", 400, "INVALID_TYPE")
  }

  if (extension !== ".pdf" && extension !== ".docx") {
    throw new ResumeUploadError("Only PDF and DOCX files are allowed.", 400, "INVALID_TYPE")
  }

  const mimeOk =
    !mime ||
    mime === "application/octet-stream" ||
    (extension === ".pdf" && (mime === PDF_MIME || mime === "application/x-pdf")) ||
    (extension === ".docx" && mime === DOCX_MIME)

  if (!mimeOk) {
    throw new ResumeUploadError("Only PDF and DOCX files are allowed.", 400, "INVALID_TYPE")
  }

  if (extension === ".pdf" && isPdfMagic) return "pdf"
  if (extension === ".docx" && isZipMagic) return "docx"

  throw new ResumeUploadError("Only PDF and DOCX files are allowed.", 400, "INVALID_TYPE")
}

export function validateResumeUpload(input: {
  fileName: string
  mimeType: string
  size: number
  buffer: Buffer
}): ResumeFileType {
  if (!input.buffer?.length) {
    throw new ResumeUploadError(
      "This document appears to be empty or could not be read.",
      400,
      "EMPTY_FILE"
    )
  }

  if (input.size > MAX_RESUME_FILE_SIZE || input.buffer.length > MAX_RESUME_FILE_SIZE) {
    throw new ResumeUploadError("File size must be less than 5MB.", 400, "FILE_TOO_LARGE")
  }

  return detectResumeFileType(input.fileName, input.mimeType, input.buffer)
}
