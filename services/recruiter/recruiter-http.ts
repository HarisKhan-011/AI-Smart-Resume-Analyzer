import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import { canAccessRecruiterRoutes } from "@/lib/auth-paths"
import {
  createRecruiterJob,
  deleteRecruiterJob,
  listRecruiterJobs,
  updateRecruiterJob,
  RecruiterError,
  type RecruiterJobPayload,
} from "@/services/recruiter/recruiter-job-service"
import type { UserRole } from "@/types/user"

type ApiUser = {
  id: string
  role: UserRole
}

function unauthorized() {
  return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
}

function forbidden() {
  return NextResponse.json(
    { error: "You do not have permission to manage recruiter jobs." },
    { status: 403 }
  )
}

export async function handleListRecruiterJobsRequest(
  user: ApiUser | null,
  list: typeof listRecruiterJobs = listRecruiterJobs
) {
  if (!user) return unauthorized()
  if (!canAccessRecruiterRoutes(user.role)) return forbidden()

  try {
    const jobs = await list(user.id)
    return NextResponse.json({ jobs })
  } catch (error) {
    return recruiterErrorResponse(user.id, error)
  }
}

export async function handleCreateRecruiterJobRequest(
  user: ApiUser | null,
  input: RecruiterJobPayload,
  create: typeof createRecruiterJob = createRecruiterJob
) {
  if (!user) return unauthorized()
  if (!canAccessRecruiterRoutes(user.role)) return forbidden()

  try {
    const job = await create(user.id, input)
    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    return recruiterErrorResponse(user.id, error)
  }
}

export async function handleUpdateRecruiterJobRequest(
  user: ApiUser | null,
  id: string,
  input: RecruiterJobPayload,
  update: typeof updateRecruiterJob = updateRecruiterJob
) {
  if (!user) return unauthorized()
  if (!canAccessRecruiterRoutes(user.role)) return forbidden()

  try {
    const job = await update(id, user.id, input)
    return NextResponse.json({ job })
  } catch (error) {
    return recruiterErrorResponse(user.id, error)
  }
}

export async function handleDeleteRecruiterJobRequest(
  user: ApiUser | null,
  id: string,
  remove: typeof deleteRecruiterJob = deleteRecruiterJob
) {
  if (!user) return unauthorized()
  if (!canAccessRecruiterRoutes(user.role)) return forbidden()

  try {
    await remove(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return recruiterErrorResponse(user.id, error)
  }
}

function recruiterErrorResponse(userId: string, error: unknown) {
  if (error instanceof RecruiterError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }

  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Cannot update recruiter jobs because the database is unavailable." },
      { status: 503 }
    )
  }

  console.error("Recruiter job request failed", {
    userId,
    error: error instanceof Error ? error.message : "unknown",
  })
  return NextResponse.json({ error: "Unable to update recruiter jobs. Please try again." }, { status: 500 })
}
