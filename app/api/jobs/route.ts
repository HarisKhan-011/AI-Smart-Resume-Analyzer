import { getApiUser } from "@/lib/auth-utils"
import { handleListJobsRequest } from "@/services/job-http"

export async function GET() {
  const user = await getApiUser()
  return handleListJobsRequest(user)
}
