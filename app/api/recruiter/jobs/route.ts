import { getApiUser } from "@/lib/auth-utils"
import {
  handleCreateRecruiterJobRequest,
  handleListRecruiterJobsRequest,
} from "@/services/recruiter/recruiter-http"

export const runtime = "nodejs"

export async function GET() {
  const user = await getApiUser()
  return handleListRecruiterJobsRequest(user)
}

export async function POST(request: Request) {
  const user = await getApiUser()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  return handleCreateRecruiterJobRequest(user, {
    title: typeof body?.title === "string" ? body.title : undefined,
    company: typeof body?.company === "string" ? body.company : undefined,
    location: typeof body?.location === "string" ? body.location : undefined,
    employmentType: typeof body?.employmentType === "string" ? body.employmentType : undefined,
    description: typeof body?.description === "string" ? body.description : undefined,
    requiredSkills: typeof body?.requiredSkills === "string" || Array.isArray(body?.requiredSkills)
      ? (body?.requiredSkills as string | string[])
      : undefined,
    preferredSkills:
      typeof body?.preferredSkills === "string" || Array.isArray(body?.preferredSkills)
        ? (body?.preferredSkills as string | string[])
        : undefined,
    isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
  })
}
