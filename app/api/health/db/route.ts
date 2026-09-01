import { NextResponse } from "next/server"
import { getApiUser } from "@/lib/auth-utils"
import { getDatabaseHealth } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getApiUser()
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const health = await getDatabaseHealth()

  return NextResponse.json(
    {
      ok: health.ok,
      service: "mongodb",
      status: health.status,
    },
    { status: health.ok ? 200 : 503 }
  )
}
