import { getApiUser } from "@/lib/auth-utils"
import {
  handleDeleteApplicationRequest,
  handleUpdateApplicationRequest,
} from "@/services/applications/application-http"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleUpdateApplicationRequest(user, id, {
    status: typeof body?.status === "string" ? body.status : undefined,
    notes: typeof body?.notes === "string" ? body.notes : undefined,
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  return handleDeleteApplicationRequest(user, id)
}
