import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import { generateCareerRoadmap } from "@/services/career-roadmap/career-roadmap-service"
import { MatchingError } from "@/services/matching/run-match"

type ApiUser = {
  id: string
}

export async function handleCareerRoadmapRequest(
  user: ApiUser | null,
  input: { resumeId?: string; jobId?: string },
  generate: typeof generateCareerRoadmap = generateCareerRoadmap
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to generate a career roadmap." },
      { status: 401 }
    )
  }

  const resumeId = input.resumeId?.trim() ?? ""
  const jobId = input.jobId?.trim() ?? ""
  if (!resumeId || !jobId) {
    return NextResponse.json({ error: "Resume and target job are required." }, { status: 400 })
  }

  try {
    const result = await generate(user.id, resumeId, jobId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof MatchingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot generate a career roadmap because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Career roadmap failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json(
      { error: "Unable to generate a career roadmap. Please try again." },
      { status: 500 }
    )
  }
}
