import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  analyzeOwnedSkillGap,
} from "@/services/skill-gap/skill-gap-service"
import { MatchingError } from "@/services/matching/run-match"

type ApiUser = {
  id: string
}

export async function handleSkillGapRequest(
  user: ApiUser | null,
  input: { resumeId?: string; jobId?: string },
  analyze: typeof analyzeOwnedSkillGap = analyzeOwnedSkillGap
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to analyze a skill gap." },
      { status: 401 }
    )
  }

  const resumeId = input.resumeId?.trim() ?? ""
  const jobId = input.jobId?.trim() ?? ""
  if (!resumeId || !jobId) {
    return NextResponse.json({ error: "Resume and job are required." }, { status: 400 })
  }

  try {
    const result = await analyze(user.id, resumeId, jobId)
    return NextResponse.json({
      coveragePercent: result.coveragePercent,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      preferredMatchedSkills: result.preferredMatchedSkills,
      preferredMissingSkills: result.preferredMissingSkills,
      recommendations: result.recommendations,
      match: result.match,
      resume: result.resume,
      job: result.job,
    })
  } catch (error) {
    if (error instanceof MatchingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot analyze skill gap because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Skill gap analysis failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json(
      { error: "Unable to analyze skill gap. Please try again." },
      { status: 500 }
    )
  }
}
