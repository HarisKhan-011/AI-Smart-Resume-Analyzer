import { Schema, model, models, type Document, type Model } from "mongoose"
import type { UserRole } from "@/types/user"

export interface UserDocument extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface PublicUserDTO {
  id: string
  name: string
  email: string
  role: UserRole
  image: string | null
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const value = ret as unknown as Record<string, unknown> & {
      _id?: { toString(): string }
    }
    value.id = value._id?.toString()
    delete value._id
    delete value.__v
    delete value.passwordHash
    return value
  },
})

export function toPublicUser(user: UserDocument): PublicUserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", UserSchema)
