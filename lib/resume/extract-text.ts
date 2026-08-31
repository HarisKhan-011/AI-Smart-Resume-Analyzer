import mammoth from "mammoth"
import { ResumeUploadError, type ResumeFileType } from "@/lib/resume/file-validation"
import { cleanExtractedText, isExtractedTextUsable } from "@/lib/resume/text-cleaner"

type TextExtractor = (buffer: Buffer) => Promise<string>

async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfModule = await import("pdf-parse")
  const pdfParse =
    (pdfModule as { default?: (data: Buffer) => Promise<{ text: string }> }).default ??
    (pdfModule as unknown as (data: Buffer) => Promise<{ text: string }>)
  const result = await pdfParse(buffer)
  return result.text ?? ""
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value ?? ""
}

export async function extractResumeText(
  buffer: Buffer,
  fileType: ResumeFileType,
  extractors: { pdf?: TextExtractor; docx?: TextExtractor } = {}
): Promise<string> {
  try {
    const extractor = fileType === "pdf" ? extractors.pdf ?? extractPdf : extractors.docx ?? extractDocx
    const cleaned = cleanExtractedText(await extractor(buffer))

    if (!isExtractedTextUsable(cleaned)) {
      throw new ResumeUploadError(
        "This document appears to be empty or could not be read. Please upload a text-based PDF or DOCX resume.",
        400,
        "EMPTY_DOCUMENT"
      )
    }

    return cleaned
  } catch (error) {
    if (error instanceof ResumeUploadError) throw error
    throw new ResumeUploadError(
      "This document appears to be empty or could not be read.",
      400,
      "EXTRACT_FAILED"
    )
  }
}
