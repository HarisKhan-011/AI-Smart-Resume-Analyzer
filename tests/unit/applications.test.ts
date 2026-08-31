import { describe, expect, it, jest } from "@jest/globals"
import {
  handleCreateApplicationRequest,
  handleDeleteApplicationRequest,
  handleListApplicationsRequest,
  handleUpdateApplicationRequest,
} from "@/services/applications/application-http"
import {
  appliedAtForStatus,
  ApplicationError,
} from "@/services/applications/application-service"
import { isApplicationStatus } from "@/services/applications/status"
import type { Application } from "@/types/application"
import type { ApplicationWithJob } from "@/services/applications/application-service"

const user = { id: "507f1f77bcf86cd799439012" }
const other = { id: "507f1f77bcf86cd799439099" }
const jobId = "507f1f77bcf86cd799439033"
const applicationId = "507f1f77bcf86cd799439044"

function mockApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: applicationId,
    userId: user.id,
    jobId,
    status: "saved",
    appliedAt: null,
    notes: "",
    createdAt: new Date("2026-08-31"),
    updatedAt: new Date("2026-08-31"),
    ...overrides,
  }
}

function mockListed(overrides: Partial<ApplicationWithJob> = {}): ApplicationWithJob {
  return {
    ...mockApplication(),
    job: {
      id: jobId,
      title: "Frontend Developer",
      company: "Acme",
      location: "Remote",
      employmentType: "full-time",
    },
    matchScore: 85,
    ...overrides,
  }
}

describe("application status helpers", () => {
  it("accepts the five tracking statuses", () => {
    expect(isApplicationStatus("saved")).toBe(true)
    expect(isApplicationStatus("offered")).toBe(true)
    expect(isApplicationStatus("unknown")).toBe(false)
  })

  it("sets appliedAt when moving to applied and keeps an existing date", () => {
    const first = appliedAtForStatus("applied")
    expect(first).toBeInstanceOf(Date)
    const existing = new Date("2026-01-01")
    expect(appliedAtForStatus("interview", existing)).toBe(existing)
    expect(appliedAtForStatus("saved")).toBeNull()
  })
})

describe("applications API", () => {
  it("rejects unauthenticated create, list, update, and delete", async () => {
    expect((await handleCreateApplicationRequest(null, { jobId })).status).toBe(401)
    expect((await handleListApplicationsRequest(null)).status).toBe(401)
    expect((await handleUpdateApplicationRequest(null, applicationId, { status: "applied" })).status).toBe(401)
    expect((await handleDeleteApplicationRequest(null, applicationId)).status).toBe(401)
  })

  it("creates a saved application", async () => {
    const track = jest.fn(async () => ({
      application: mockApplication(),
      alreadyExists: false,
    }))
    const response = await handleCreateApplicationRequest(
      user,
      { jobId, status: "saved" },
      track
    )
    expect(response.status).toBe(201)
    expect(track).toHaveBeenCalledWith(user.id, { jobId, status: "saved" })
  })

  it("returns 200 when the job is already tracked", async () => {
    const response = await handleCreateApplicationRequest(user, { jobId }, async () => ({
      application: mockApplication({ status: "applied" }),
      alreadyExists: true,
    }))
    expect(response.status).toBe(200)
  })

  it("maps missing jobs to 404", async () => {
    const response = await handleCreateApplicationRequest(user, { jobId }, async () => {
      throw new ApplicationError("Job not found.", 404, "JOB_NOT_FOUND")
    })
    expect(response.status).toBe(404)
  })

  it("rejects invalid statuses", async () => {
    const response = await handleCreateApplicationRequest(user, { jobId, status: "hired" }, async () => {
      throw new ApplicationError("Invalid application status.", 400, "INVALID_STATUS")
    })
    expect(response.status).toBe(400)
  })

  it("lists only the current user's applications with job details", async () => {
    const listed = mockListed()
    const response = await handleListApplicationsRequest(
      user,
      {},
      {
        listOwnedApplicationsWithJobs: async (userId) => {
          expect(userId).toBe(user.id)
          return [listed]
        },
        countOwnedApplicationsByStatus: async () => ({
          saved: 1,
          applied: 0,
          interview: 0,
          offered: 0,
          rejected: 0,
        }),
      }
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { applications: ApplicationWithJob[]; counts: { saved: number } }
    expect(body.applications).toHaveLength(1)
    expect(body.applications[0]?.job?.title).toBe("Frontend Developer")
    expect(body.counts.saved).toBe(1)
  })

  it("does not update another user's application", async () => {
    const response = await handleUpdateApplicationRequest(
      other,
      applicationId,
      { status: "applied" },
      async () => {
        throw new ApplicationError("Application not found.", 404, "NOT_FOUND")
      }
    )
    expect(response.status).toBe(404)
  })

  it("does not delete another user's application", async () => {
    const response = await handleDeleteApplicationRequest(other, applicationId, async () => {
      throw new ApplicationError("Application not found.", 404, "NOT_FOUND")
    })
    expect(response.status).toBe(404)
  })

  it("deletes an owned application", async () => {
    const remove = jest.fn(async () => true)
    const response = await handleDeleteApplicationRequest(user, applicationId, remove)
    expect(response.status).toBe(200)
    expect(remove).toHaveBeenCalledWith(applicationId, user.id)
  })
})
