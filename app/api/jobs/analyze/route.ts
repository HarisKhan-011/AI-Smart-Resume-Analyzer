import { getApiUser } from "@/lib/auth-utils"
import { handleAnalyzeJobRequest } from "@/services/job-http"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleAnalyzeJobRequest(user, {
    title: typeof body?.title === "string" ? body.title : "",
    company: typeof body?.company === "string" ? body.company : "",
    location: typeof body?.location === "string" ? body.location : "",
    description: typeof body?.description === "string" ? body.description : "",
  })
}
