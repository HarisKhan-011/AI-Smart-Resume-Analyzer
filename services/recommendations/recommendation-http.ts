import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  recommendJobsForUser,
  RecommendationError,
} from "@/services/recommendations/recommendation-service"

type ApiUser = {
  id: string
}

export async function handleGetRecommendationsRequest(
  user: ApiUser | null,
  resumeId?: string,
  recommend: typeof recommendJobsForUser = recommendJobsForUser
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to view recommendations." },
      { status: 401 }
    )
  }

  try {
    const result = await recommend(user.id, resumeId)
    return NextResponse.json({
      resume: result.resume,
      recommendations: result.recommendations,
    })
  } catch (error) {
    if (error instanceof RecommendationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot load recommendations because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Job recommendations failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json(
      { error: "Unable to load recommendations. Please try again." },
      { status: 500 }
    )
  }
}
