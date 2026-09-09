import { Schema, model, models, type Document, type Model, type Types } from "mongoose"
import type { ChatRole } from "@/types/chat"

export type ChatMessageDocument = {
  role: ChatRole
  content: string
  createdAt: Date
}

export interface ChatConversationDocument extends Document {
  userId: Types.ObjectId
  messages: ChatMessageDocument[]
  createdAt: Date
  updatedAt: Date
}

const ChatMessageSchema = new Schema<ChatMessageDocument>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
)

const ChatConversationSchema = new Schema<ChatConversationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

ChatConversationSchema.index({ userId: 1 }, { unique: true })

export const ChatConversation: Model<ChatConversationDocument> =
  (models.ChatConversation as Model<ChatConversationDocument> | undefined) ??
  model<ChatConversationDocument>("ChatConversation", ChatConversationSchema)
