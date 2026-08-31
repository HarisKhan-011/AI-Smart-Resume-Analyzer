import { getApiUser } from "@/lib/auth-utils"
import { handleAnalyzeResumeRequest } from "@/services/resume-http"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  return handleAnalyzeResumeRequest(user, id)
}
