import { Types } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { hashPassword } from "@/lib/password"
import { toPublicUser, User, type PublicUserDTO, type UserDocument } from "@/models/user"
import type { PublicRegisterRole, UserRole } from "@/types/user"

export type CreateUserInput = {
  name: string
  email: string
  password: string
  phone?: string
  role: PublicRegisterRole | UserRole
  image?: string | null
}

export async function createUser(input: CreateUserInput): Promise<PublicUserDTO> {
  await dbConnect()

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
    phone: input.phone ?? "",
    image: input.image ?? null,
  })

  return toPublicUser(user)
}

export async function getUserById(id: string): Promise<PublicUserDTO | null> {
  await dbConnect()
  const user = await User.findById(id)
  return user ? toPublicUser(user) : null
}

export async function getUserByEmail(email: string): Promise<PublicUserDTO | null> {
  await dbConnect()
  const user = await User.findOne({ email: email.toLowerCase() })
  return user ? toPublicUser(user) : null
}

export async function findUserForAuth(
  email: string
): Promise<UserDocument | null> {
  await dbConnect()
  return User.findOne({ email: email.toLowerCase() }).select("+passwordHash")
}

export async function userExistsByEmail(email: string): Promise<boolean> {
  await dbConnect()
  const existing = await User.exists({ email: email.toLowerCase() })
  return Boolean(existing)
}

export type UpdateProfileInput = {
  name: string
  phone?: string
  title?: string
  location?: string
  bio?: string
  image?: string | null
}

export async function updateOwnedUser(userId: string, input: UpdateProfileInput): Promise<PublicUserDTO | null> {
  await dbConnect()
  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      phone: input.phone ?? "",
      title: input.title ?? "",
      location: input.location ?? "",
      bio: input.bio ?? "",
      ...(input.image !== undefined ? { image: input.image || null } : {}),
    },
    { new: true }
  )
  return user ? toPublicUser(user) : null
}

export async function deleteOwnedUserAccount(userId: string): Promise<boolean> {
  await dbConnect()
  const { Resume } = await import("@/models/resume")
  const { Match } = await import("@/models/match")
  const { Application } = await import("@/models/application")
  const { ChatConversation } = await import("@/models/chat-conversation")
  const ownerId = new Types.ObjectId(userId)

  await Promise.all([
    Resume.deleteMany({ userId: ownerId }),
    Match.deleteMany({ userId: ownerId }),
    Application.deleteMany({ userId: ownerId }),
    ChatConversation.deleteMany({ userId: ownerId }),
  ])
  const result = await User.findByIdAndDelete(userId)
  return Boolean(result)
}
