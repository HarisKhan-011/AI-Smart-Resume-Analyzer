import { describe, expect, it, jest } from "@jest/globals"
import { handleSkillGapRequest } from "@/services/skill-gap-http"
import { MatchingError } from "@/services/matching/run-match"

const user = { id: "507f1f77bcf86cd799439012" }
const resumeId = "507f1f77bcf86cd799439011"
const jobId = "507f1f77bcf86cd799439033"

describe("skill gap API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await handleSkillGapRequest(null, { resumeId, jobId })
    expect(response.status).toBe(401)
  })

  it("returns 404 when the resume is not owned by the user", async () => {
    const analyze = jest.fn(async () => {
      throw new MatchingError("Resume not found.", 404, "RESUME_NOT_FOUND")
    })
    const response = await handleSkillGapRequest(user, { resumeId, jobId }, analyze)
    expect(response.status).toBe(404)
  })

  it("requires resume and job IDs", async () => {
    const response = await handleSkillGapRequest(user, { resumeId: "", jobId: "" })
    expect(response.status).toBe(400)
  })
})
