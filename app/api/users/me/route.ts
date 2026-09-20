import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import { profileUpdateSchema } from "@/lib/validations"
import {
  deleteOwnedUserAccount,
  getUserById,
  updateOwnedUser,
} from "@/services/user-service"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await getUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ error: "Database is unavailable." }, { status: 503 })
    }
    console.error("Get current user error:", error)
    return NextResponse.json(
      { error: "Unable to load your account." },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const user = await updateOwnedUser(session.user.id, parsed.data)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ error: "Database is unavailable." }, { status: 503 })
    }
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const deleted = await deleteOwnedUserAccount(session.user.id)
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ error: "Database is unavailable." }, { status: 503 })
    }
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Unable to delete this account." }, { status: 500 })
  }
}
