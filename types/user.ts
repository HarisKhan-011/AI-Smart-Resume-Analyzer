export const USER_ROLE_VALUES = ["candidate", "recruiter", "admin"] as const

export type UserRole = (typeof USER_ROLE_VALUES)[number]

export const PUBLIC_REGISTER_ROLES = ["candidate", "recruiter"] as const
export type PublicRegisterRole = (typeof PUBLIC_REGISTER_ROLES)[number]

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends User {
  profile?: {
    title?: string
    location?: string
    bio?: string
  }
}

export type PublicUser = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string | Date
  updatedAt: string | Date
}
