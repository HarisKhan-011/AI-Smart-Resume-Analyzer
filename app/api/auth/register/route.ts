import { NextResponse } from "next/server"
import { dbConnect, isDatabaseUnavailable } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { registerSchema } from "@/lib/validations"
import { toPublicUser, User } from "@/models/user"

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

    const { name, email, password, role } = parsed.data

    await dbConnect()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
    })

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }
    console.error("Registration error:", error)

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error:
            "Cannot connect to MongoDB. Start MongoDB locally or set MONGODB_URI to a MongoDB Atlas connection string.",
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
