import { getApiUser } from "@/lib/auth-utils"
import { handleGetJobRequest } from "@/services/job-http"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  return handleGetJobRequest(user, id)
}
