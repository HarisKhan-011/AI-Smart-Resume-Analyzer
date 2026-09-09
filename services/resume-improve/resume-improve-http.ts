import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  improveOwnedResume,
  ResumeImproveError,
} from "@/services/resume-improve/resume-improve-service"
import { ChatLlmError } from "@/services/chat/chat-llm"

type ApiUser = {
  id: string
}

export async function handleResumeImproveRequest(
  user: ApiUser | null,
  input: { resumeId?: string; jobId?: string },
  improve: typeof improveOwnedResume = improveOwnedResume
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to improve a resume." },
      { status: 401 }
    )
  }

  try {
    const result = await improve(user.id, input.resumeId ?? "", input.jobId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ResumeImproveError || error instanceof ChatLlmError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot improve this resume because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Resume improve failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json(
      { error: "Unable to improve this resume. Please try again." },
      { status: 500 }
    )
  }
}
