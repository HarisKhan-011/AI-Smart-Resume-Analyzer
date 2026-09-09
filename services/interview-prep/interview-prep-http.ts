import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  evaluateInterviewAnswer,
  generateInterviewPrep,
  InterviewPrepError,
} from "@/services/interview-prep/interview-prep-service"
import { ChatLlmError } from "@/services/chat/chat-llm"
import type { InterviewQuestion } from "@/types/interview-prep"

type ApiUser = {
  id: string
}

function interviewErrorResponse(userId: string, error: unknown) {
  if (error instanceof InterviewPrepError || error instanceof ChatLlmError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Cannot run interview prep because the database is unavailable." },
      { status: 503 }
    )
  }
  console.error("Interview prep failed", {
    userId,
    error: error instanceof Error ? error.message : "unknown",
  })
  return NextResponse.json({ error: "Unable to complete interview prep. Please try again." }, { status: 500 })
}

export async function handleGenerateInterviewPrepRequest(
  user: ApiUser | null,
  input: { resumeId?: string; jobId?: string },
  generate: typeof generateInterviewPrep = generateInterviewPrep
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to prepare for interviews." },
      { status: 401 }
    )
  }

  try {
    const result = await generate(user.id, input.resumeId ?? "", input.jobId)
    return NextResponse.json(result)
  } catch (error) {
    return interviewErrorResponse(user.id, error)
  }
}

function asQuestion(value: unknown): InterviewQuestion | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.prompt !== "string") return null
  if (row.category !== "technical" && row.category !== "behavioral" && row.category !== "hr") return null
  const difficulty = row.difficulty === "easy" || row.difficulty === "medium" || row.difficulty === "hard"
    ? row.difficulty
    : "medium"
  return {
    id: row.id,
    category: row.category,
    difficulty,
    prompt: row.prompt,
    focus: typeof row.focus === "string" ? row.focus : "",
  }
}

export async function handleEvaluateInterviewAnswerRequest(
  user: ApiUser | null,
  input: { resumeId?: string; jobId?: string; question?: unknown; answer?: string },
  evaluate: typeof evaluateInterviewAnswer = evaluateInterviewAnswer
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to evaluate an interview answer." },
      { status: 401 }
    )
  }

  const question = asQuestion(input.question)
  if (!question) {
    return NextResponse.json({ error: "A valid question is required." }, { status: 400 })
  }

  try {
    const result = await evaluate(user.id, {
      resumeId: input.resumeId ?? "",
      jobId: input.jobId,
      question,
      answer: input.answer ?? "",
    })
    return NextResponse.json(result)
  } catch (error) {
    return interviewErrorResponse(user.id, error)
  }
}
