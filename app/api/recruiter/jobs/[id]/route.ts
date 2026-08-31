import { getApiUser } from "@/lib/auth-utils"
import {
  handleDeleteRecruiterJobRequest,
  handleUpdateRecruiterJobRequest,
} from "@/services/recruiter/recruiter-http"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleUpdateRecruiterJobRequest(user, id, {
    title: typeof body?.title === "string" ? body.title : undefined,
    company: typeof body?.company === "string" ? body.company : undefined,
    location: typeof body?.location === "string" ? body.location : undefined,
    employmentType: typeof body?.employmentType === "string" ? body.employmentType : undefined,
    description: typeof body?.description === "string" ? body.description : undefined,
    requiredSkills:
      typeof body?.requiredSkills === "string" || Array.isArray(body?.requiredSkills)
        ? (body?.requiredSkills as string | string[])
        : undefined,
    preferredSkills:
      typeof body?.preferredSkills === "string" || Array.isArray(body?.preferredSkills)
        ? (body?.preferredSkills as string | string[])
        : undefined,
    isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  const { id } = await context.params
  return handleDeleteRecruiterJobRequest(user, id)
}
