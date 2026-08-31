import { getApiUser } from "@/lib/auth-utils"
import {
  handleCreateApplicationRequest,
  handleListApplicationsRequest,
} from "@/services/applications/application-http"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await getApiUser()
  const { searchParams } = new URL(request.url)

  return handleListApplicationsRequest(user, {
    status: searchParams.get("status") ?? undefined,
    jobId: searchParams.get("jobId") ?? undefined,
  })
}

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleCreateApplicationRequest(user, {
    jobId: typeof body?.jobId === "string" ? body.jobId : "",
    status: typeof body?.status === "string" ? body.status : undefined,
    notes: typeof body?.notes === "string" ? body.notes : undefined,
  })
}
