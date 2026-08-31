import { dbConnect } from "@/lib/mongodb"
import { hashPassword } from "@/lib/password"
import { toPublicUser, User, type PublicUserDTO, type UserDocument } from "@/models/user"
import type { PublicRegisterRole, UserRole } from "@/types/user"

export type CreateUserInput = {
  name: string
  email: string
  password: string
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
