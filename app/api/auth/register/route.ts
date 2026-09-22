import { NextResponse } from "next/server"
import {
  getDatabaseUnavailableMessage,
  isDatabaseUnavailable,
  isDuplicateKeyError,
  isMongooseValidationError,
} from "@/lib/mongodb"
import { registerSchema } from "@/lib/validations"
import { createUser, userExistsByEmail } from "@/services/user-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, password, phone } = parsed.data

    if (await userExistsByEmail(email)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    const user = await createUser({
      name,
      email,
      password,
      phone,
      role: "candidate",
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }
    console.error("Registration error:", error)

    if (isMongooseValidationError(error)) {
      const message =
        error instanceof Error && error.message
          ? error.message.replace(/^User validation failed:\s*/i, "")
          : "Check your name, email, and phone number."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: getDatabaseUnavailableMessage(error),
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    )
  }
}
