import { getApiUser } from "@/lib/auth-utils"
import { handleGetResumeRequest } from "@/services/resume-http"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  return handleGetResumeRequest(user, id)
}
