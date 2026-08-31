import { describe, expect, it, jest } from "@jest/globals"
import { ownedResumeFilter } from "@/services/resume-service"
import {
  handleGetResumeRequest,
  handleListResumesRequest,
  handleResumeUploadRequest,
} from "@/services/resume-http"
import type { Resume } from "@/types/resume"

const ownerId = "507f1f77bcf86cd799439012"
const otherId = "507f1f77bcf86cd799439099"
const resumeId = "507f1f77bcf86cd799439011"

const owner = {
  id: ownerId,
  name: "Owner",
  email: "owner@example.com",
}

const ownedResume: Resume = {
  id: resumeId,
  userId: ownerId,
  fileName: "cv.pdf",
  fileUrl: "local://resumes/owner/cv.pdf",
  fileType: "pdf",
  extractedText: "Jane Candidate\nSoftware Engineer",
  skills: [],
  experience: [],
  education: [],
  analysisStatus: "pending",
  createdAt: new Date("2026-08-31"),
  updatedAt: new Date("2026-08-31"),
}

describe("resume access control", () => {
  it("rejects unauthenticated uploads", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" })
    )

    const response = await handleResumeUploadRequest(
      null,
      new Request("http://localhost/api/resumes/upload", {
        method: "POST",
        body: formData,
      })
    )

    expect(response.status).toBe(401)
    const body = (await response.json()) as { error: string }
    expect(body.error).toMatch(/signed in/i)
  })

  it("rejects unauthenticated resume list requests", async () => {
    const response = await handleListResumesRequest(null)
    expect(response.status).toBe(401)
  })

  it("scopes resume lookup to the requesting user", () => {
    expect(ownedResumeFilter(resumeId, otherId)).toEqual({
      _id: resumeId,
      userId: otherId,
    })
  })

  it("returns 404 when a user requests someone else's resume", async () => {
    const getOwnedResume = jest.fn(async () => null)
    const response = await handleGetResumeRequest(owner, resumeId, { getOwnedResume })

    expect(getOwnedResume).toHaveBeenCalledWith(resumeId, ownerId)
    expect(response.status).toBe(404)
    const body = (await response.json()) as { error: string }
    expect(body.error).toMatch(/not found/i)
  })

  it("returns the resume only when the owner requests it", async () => {
    const getOwnedResume = jest.fn(async () => ownedResume)
    const response = await handleGetResumeRequest(owner, resumeId, { getOwnedResume })

    expect(response.status).toBe(200)
    const body = (await response.json()) as { resume: Resume }
    expect(body.resume.id).toBe(resumeId)
    expect(body.resume.userId).toBe(ownerId)
  })
})
