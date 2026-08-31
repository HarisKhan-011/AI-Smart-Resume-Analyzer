import { describe, expect, it } from "@jest/globals"
import { extractResumeText } from "@/lib/resume/extract-text"
import { ResumeUploadError } from "@/lib/resume/file-validation"

const sampleText =
  "Jane Candidate\nSoftware Engineer\nBuilt web applications with React and Node.js."

describe("resume text extraction", () => {
  it("extracts and cleans PDF text", async () => {
    const text = await extractResumeText(Buffer.from("%PDF-1.4"), "pdf", {
      pdf: async () => "Jane   Candidate\n\n\nSoftware Engineer with five years of experience",
    })

    expect(text).toContain("Jane Candidate")
    expect(text).not.toMatch(/\n{3,}/)
  })

  it("extracts and cleans DOCX text", async () => {
    const text = await extractResumeText(Buffer.from("PK"), "docx", {
      docx: async () => sampleText,
    })

    expect(text).toBe(sampleText)
  })

  it("rejects empty extracted documents", async () => {
    await expect(
      extractResumeText(Buffer.from("%PDF-1.4"), "pdf", {
        pdf: async () => "   \n\n",
      })
    ).rejects.toMatchObject({ code: "EMPTY_DOCUMENT" })
  })

  it("returns a clear error when a parser fails", async () => {
    await expect(
      extractResumeText(Buffer.from("PK"), "docx", {
        docx: async () => {
          throw new Error("corrupt zip")
        },
      })
    ).rejects.toBeInstanceOf(ResumeUploadError)
  })
})
