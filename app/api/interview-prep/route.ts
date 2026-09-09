import { getApiUser } from "@/lib/auth-utils"
import { handleGenerateInterviewPrepRequest } from "@/services/interview-prep/interview-prep-http"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleGenerateInterviewPrepRequest(user, {
    resumeId: typeof body?.resumeId === "string" ? body.resumeId : "",
    jobId: typeof body?.jobId === "string" ? body.jobId : "",
  })
}
