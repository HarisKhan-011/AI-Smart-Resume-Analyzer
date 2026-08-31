import { getApiUser } from "@/lib/auth-utils"
import { handleListResumesRequest } from "@/services/resume-http"

export async function GET() {
  const user = await getApiUser()
  return handleListResumesRequest(user)
}
