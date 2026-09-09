import { getApiUser } from "@/lib/auth-utils"
import { handleCareerRoadmapRequest } from "@/services/career-roadmap/career-roadmap-http"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleCareerRoadmapRequest(user, {
    resumeId: typeof body?.resumeId === "string" ? body.resumeId : "",
    jobId: typeof body?.jobId === "string" ? body.jobId : "",
  })
}
