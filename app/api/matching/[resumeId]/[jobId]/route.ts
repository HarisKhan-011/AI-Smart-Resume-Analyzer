import { getApiUser } from "@/lib/auth-utils"
import { handleGetMatchRequest } from "@/services/matching-http"

export async function GET(
  _request: Request,
  context: { params: Promise<{ resumeId: string; jobId: string }> }
) {
  const user = await getApiUser()
  const { resumeId, jobId } = await context.params
  return handleGetMatchRequest(user, resumeId, jobId)
}
