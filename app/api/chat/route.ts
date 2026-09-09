import { getApiUser } from "@/lib/auth-utils"
import { handleChatRequest, handleGetChatRequest } from "@/services/chat/chat-http"

export const runtime = "nodejs"

export async function GET() {
  const user = await getApiUser()
  return handleGetChatRequest(user)
}

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleChatRequest(user, {
    message: typeof body?.message === "string" ? body.message : "",
    reset: body?.reset === true,
  })
}
