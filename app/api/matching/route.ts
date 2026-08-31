import { getApiUser } from "@/lib/auth-utils"
import { handleCreateMatchRequest } from "@/services/matching-http"

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleCreateMatchRequest(user, {
    resumeId: typeof body?.resumeId === "string" ? body.resumeId : "",
    jobId: typeof body?.jobId === "string" ? body.jobId : "",
  })
}
