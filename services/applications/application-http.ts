import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  countOwnedApplicationsByStatus,
  deleteOwnedApplication,
  getApplicationByUserAndJob,
  listOwnedApplicationsWithJobs,
  trackOwnedApplication,
  updateOwnedApplication,
  ApplicationError,
  type TrackApplicationInput,
  type UpdateOwnedApplicationInput,
} from "@/services/applications/application-service"
import { isApplicationStatus } from "@/services/applications/status"
import type { ApplicationStatus } from "@/types/application"

type ApiUser = {
  id: string
}

function parseStatus(value: string | null | undefined): ApplicationStatus | undefined {
  const status = value?.trim()
  if (!status || status === "all") return undefined
  if (!isApplicationStatus(status)) {
    throw new ApplicationError("Invalid application status.", 400, "INVALID_STATUS")
  }
  return status
}

export async function handleCreateApplicationRequest(
  user: ApiUser | null,
  input: TrackApplicationInput,
  track: typeof trackOwnedApplication = trackOwnedApplication
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to track an application." },
      { status: 401 }
    )
  }

  try {
    const result = await track(user.id, input)
    return NextResponse.json(
      { application: result.application, alreadyExists: result.alreadyExists },
      { status: result.alreadyExists ? 200 : 201 }
    )
  } catch (error) {
    return applicationErrorResponse(user.id, error)
  }
}

export async function handleListApplicationsRequest(
  user: ApiUser | null,
  query: { status?: string; jobId?: string } = {},
  deps: {
    listOwnedApplicationsWithJobs?: typeof listOwnedApplicationsWithJobs
    getApplicationByUserAndJob?: typeof getApplicationByUserAndJob
    countOwnedApplicationsByStatus?: typeof countOwnedApplicationsByStatus
  } = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const status = parseStatus(query.status)
    const list = deps.listOwnedApplicationsWithJobs ?? listOwnedApplicationsWithJobs
    const count = deps.countOwnedApplicationsByStatus ?? countOwnedApplicationsByStatus

    if (query.jobId?.trim()) {
      const load = deps.getApplicationByUserAndJob ?? getApplicationByUserAndJob
      const application = await load(user.id, query.jobId.trim())
      return NextResponse.json({
        application,
        applications: application ? [application] : [],
        counts: await count(user.id),
      })
    }

    const [applications, counts] = await Promise.all([
      list(user.id, status),
      count(user.id),
    ])

    return NextResponse.json({ applications, counts })
  } catch (error) {
    return applicationErrorResponse(user.id, error)
  }
}

export async function handleUpdateApplicationRequest(
  user: ApiUser | null,
  id: string,
  input: UpdateOwnedApplicationInput,
  update: typeof updateOwnedApplication = updateOwnedApplication
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const application = await update(id, user.id, input)
    return NextResponse.json({ application })
  } catch (error) {
    return applicationErrorResponse(user.id, error)
  }
}

export async function handleDeleteApplicationRequest(
  user: ApiUser | null,
  id: string,
  remove: typeof deleteOwnedApplication = deleteOwnedApplication
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    await remove(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return applicationErrorResponse(user.id, error)
  }
}

function applicationErrorResponse(userId: string, error: unknown) {
  if (error instanceof ApplicationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }

  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Cannot update applications because the database is unavailable." },
      { status: 503 }
    )
  }

  console.error("Application request failed", {
    userId,
    error: error instanceof Error ? error.message : "unknown",
  })
  return NextResponse.json({ error: "Unable to update applications. Please try again." }, { status: 500 })
}
