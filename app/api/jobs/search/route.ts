import { getApiUser } from "@/lib/auth-utils"
import { handleSearchJobsRequest } from "@/services/job-http"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await getApiUser()
  const { searchParams } = new URL(request.url)

  return handleSearchJobsRequest(user, {
    keyword: searchParams.get("keyword") ?? "",
    location: searchParams.get("location") ?? "",
    jobType: searchParams.get("jobType") ?? "",
    postedWithin: searchParams.get("posted") ?? "",
  })
}
