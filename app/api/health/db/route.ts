import { NextResponse } from "next/server"
import { getDatabaseHealth } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  const health = await getDatabaseHealth()

  return NextResponse.json(
    {
      ok: health.ok,
      service: "mongodb",
      status: health.status,
      database: health.database ?? null,
      error: health.error ?? null,
    },
    { status: health.ok ? 200 : 503 }
  )
}
