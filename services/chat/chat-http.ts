import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  ChatError,
  clearOwnedChatConversation,
  getOwnedChatConversation,
  sendOwnedChatMessage,
} from "@/services/chat/chat-service"
import { ChatLlmError } from "@/services/chat/chat-llm"

import type { ChatMessage } from "@/types/chat"

type ApiUser = {
  id: string
  name?: string | null
  role?: string | null
}

function serializeMessages(messages: ChatMessage[]) {
  return messages.map((item) => {
    const createdAt =
      item.createdAt instanceof Date && !Number.isNaN(item.createdAt.getTime())
        ? item.createdAt
        : new Date(item.createdAt)
    return {
      role: item.role,
      content: item.content,
      createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
    }
  })
}

function chatErrorResponse(userId: string, error: unknown) {
  if (error instanceof ChatError || error instanceof ChatLlmError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }

  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Cannot use the career assistant because the database is unavailable." },
      { status: 503 }
    )
  }

  console.error("Career chat failed", {
    userId,
    error: error instanceof Error ? error.message : "unknown",
  })
  return NextResponse.json(
    { error: "Unable to complete the career chat request. Please try again." },
    { status: 500 }
  )
}

export async function handleGetChatRequest(
  user: ApiUser | null,
  load: typeof getOwnedChatConversation = getOwnedChatConversation
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to use the career assistant." },
      { status: 401 }
    )
  }

  try {
    const conversation = await load(user.id)
    return NextResponse.json({
      conversationId: conversation.id,
      messages: serializeMessages(conversation.messages),
    })
  } catch (error) {
    return chatErrorResponse(user.id, error)
  }
}

export async function handleChatRequest(
  user: ApiUser | null,
  input: { message?: string; reset?: boolean },
  deps: {
    sendOwnedChatMessage?: typeof sendOwnedChatMessage
    clearOwnedChatConversation?: typeof clearOwnedChatConversation
  } = {}
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to use the career assistant." },
      { status: 401 }
    )
  }

  try {
    if (input.reset) {
      const clear = deps.clearOwnedChatConversation ?? clearOwnedChatConversation
      const conversation = await clear(user.id)
      return NextResponse.json({
        conversationId: conversation.id,
        messages: serializeMessages(conversation.messages),
      })
    }

    const send = deps.sendOwnedChatMessage ?? sendOwnedChatMessage
    const result = await send(user.id, input.message ?? "", {
      name: user.name,
      role: user.role,
    })

    return NextResponse.json({
      conversationId: result.conversation.id,
      message: serializeMessages([result.reply])[0],
      messages: serializeMessages(result.conversation.messages),
    })
  } catch (error) {
    return chatErrorResponse(user.id, error)
  }
}
