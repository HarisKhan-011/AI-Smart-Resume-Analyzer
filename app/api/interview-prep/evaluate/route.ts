import { getApiUser } from "@/lib/auth-utils"
import { handleEvaluateInterviewAnswerRequest } from "@/services/interview-prep/interview-prep-http"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleEvaluateInterviewAnswerRequest(user, {
    resumeId: typeof body?.resumeId === "string" ? body.resumeId : "",
    jobId: typeof body?.jobId === "string" ? body.jobId : "",
    question: body?.question,
    answer: typeof body?.answer === "string" ? body.answer : "",
  })
}
