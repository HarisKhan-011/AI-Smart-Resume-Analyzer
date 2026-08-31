import { describe, expect, it } from "@jest/globals"
import {
  ResumeUploadError,
  sanitizeFileName,
  validateResumeUpload,
} from "@/lib/resume/file-validation"

function pdfBuffer(extra = "content"): Buffer {
  return Buffer.from(`%PDF-1.4\n${extra}`)
}

function docxBuffer(): Buffer {
  return Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])
}

describe("resume file validation", () => {
  it("accepts a PDF by extension and magic bytes", () => {
    expect(
      validateResumeUpload({
        fileName: "cv.pdf",
        mimeType: "application/pdf",
        size: 1200,
        buffer: pdfBuffer(),
      })
    ).toBe("pdf")
  })

  it("accepts a DOCX by extension and ZIP magic bytes", () => {
    expect(
      validateResumeUpload({
        fileName: "cv.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 2400,
        buffer: docxBuffer(),
      })
    ).toBe("docx")
  })

  it("rejects invalid file types", () => {
    expect(() =>
      validateResumeUpload({
        fileName: "notes.txt",
        mimeType: "text/plain",
        size: 12,
        buffer: Buffer.from("hello resume"),
      })
    ).toThrow(ResumeUploadError)
  })

  it("rejects a PDF named as another type", () => {
    expect(() =>
      validateResumeUpload({
        fileName: "cv.png",
        mimeType: "application/pdf",
        size: 1200,
        buffer: pdfBuffer(),
      })
    ).toThrow(/PDF and DOCX/)
  })

  it("rejects old .doc files", () => {
    expect(() =>
      validateResumeUpload({
        fileName: "cv.doc",
        mimeType: "application/msword",
        size: 12,
        buffer: Buffer.from("not a pdf"),
      })
    ).toThrow(/PDF and DOCX/)
  })

  it("rejects empty files", () => {
    expect(() =>
      validateResumeUpload({
        fileName: "cv.pdf",
        mimeType: "application/pdf",
        size: 0,
        buffer: Buffer.alloc(0),
      })
    ).toThrow(/empty/)
  })

  it("rejects files larger than 5MB", () => {
    expect(() =>
      validateResumeUpload({
        fileName: "cv.pdf",
        mimeType: "application/pdf",
        size: 6 * 1024 * 1024,
        buffer: pdfBuffer(),
      })
    ).toThrow(/5MB/)
  })

  it("sanitizes untrusted filenames", () => {
    expect(sanitizeFileName("../../etc/passwd.pdf")).toBe("passwd.pdf")
    expect(sanitizeFileName("my resume (final).pdf")).toBe("my resume (final).pdf")
  })
})
