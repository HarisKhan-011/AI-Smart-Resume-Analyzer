import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { dbConnect } from "@/lib/db"
import { toPublicUser, User } from "@/models/user"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await dbConnect()
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: toPublicUser(user) })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json(
      { error: "Unable to load your account." },
      { status: 500 }
    )
  }
}
