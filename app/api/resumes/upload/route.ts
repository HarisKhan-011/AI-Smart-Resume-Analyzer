import { getApiUser } from "@/lib/auth-utils"
import { handleResumeUploadRequest } from "@/services/resume-http"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  const user = await getApiUser()
  return handleResumeUploadRequest(user, request)
}
