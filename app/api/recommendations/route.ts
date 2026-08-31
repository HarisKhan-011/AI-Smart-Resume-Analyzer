import { getApiUser } from "@/lib/auth-utils"
import { handleGetRecommendationsRequest } from "@/services/recommendations/recommendation-http"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await getApiUser()
  const { searchParams } = new URL(request.url)
  return handleGetRecommendationsRequest(user, searchParams.get("resumeId") ?? "")
}
