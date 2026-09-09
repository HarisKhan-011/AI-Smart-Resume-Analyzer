"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Loader2, MessageCircle, Send, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types/chat"

type CareerChatProps = {
  initialMessages: ChatMessage[]
}

const SUGGESTIONS = [
  "How ATS-friendly is my current resume?",
  "Which skills should I learn next?",
  "How do my job matches look?",
  "What should I do with my applications?",
]

function toSafeDate(value: Date | string | number | null | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date()
}

function normalizeMessages(messages: ChatMessage[] | undefined): ChatMessage[] {
  if (!Array.isArray(messages)) return []
  return messages.map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    content: typeof item.content === "string" ? item.content : "",
    createdAt: toSafeDate(item.createdAt),
  }))
}

export function CareerChat({ initialMessages }: CareerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => normalizeMessages(initialMessages))
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, isSending])

  async function sendMessage(text: string) {
    const message = text.trim()
    if (!message || inFlightRef.current) return

    inFlightRef.current = true
    setIsSending(true)
    setError(null)
    setDraft("")

    const optimistic: ChatMessage = {
      role: "user",
      content: message,
      createdAt: new Date(),
    }
    setMessages((current) => [...current, optimistic])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const body = (await response.json()) as {
        error?: string
        messages?: ChatMessage[]
        message?: ChatMessage
      }

      if (!response.ok) {
        setMessages((current) => current.filter((item) => item !== optimistic))
        throw new Error(body.error ?? "Unable to send message.")
      }

      const nextMessages = normalizeMessages(body.messages)
      if (nextMessages.length > 0) {
        setMessages(nextMessages)
        return
      }

      if (body.message) {
        setMessages((current) => [
          ...current.filter((item) => item !== optimistic),
          optimistic,
          {
            role: "assistant",
            content: body.message?.content ?? "",
            createdAt: toSafeDate(body.message?.createdAt),
          },
        ])
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.")
    } finally {
      inFlightRef.current = false
      setIsSending(false)
    }
  }

  async function clearChat() {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setIsSending(true)
    setError(null)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      })
      const body = (await response.json()) as { error?: string; messages?: ChatMessage[] }
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to clear the conversation.")
      }
      setMessages(normalizeMessages(body.messages))
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear the conversation.")
    } finally {
      inFlightRef.current = false
      setIsSending(false)
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    void sendMessage(draft)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage(draft)
    }
  }

  const asked = new Set(messages.filter((item) => item.role === "user").map((item) => item.content))
  const followUps = SUGGESTIONS.filter((item) => !asked.has(item))

  return (
    <Card className="flex min-h-[32rem] flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Answers use only your resume, skills, ATS results, job matches, skill gaps, and applications.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void clearChat()}
            disabled={isSending || messages.length === 0}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chat error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex min-h-[22rem] flex-1 flex-col overflow-y-auto rounded-lg border bg-muted/20 p-4">
          {messages.length === 0 && !isSending ? (
            <div className="m-auto max-w-lg space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium">Ask about your career data</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  I will not invent jobs, scores, or skills that are not already in your account.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((item, index) => (
                <li
                  key={`${item.role}-${toSafeDate(item.createdAt).getTime()}-${index}`}
                  className={cn("flex", item.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      item.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{item.content}</p>
                  </div>
                </li>
              ))}
              {isSending && (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Thinking...
                  </div>
                </li>
              )}
              <div ref={bottomRef} />
            </ul>
          )}
        </div>

        {followUps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {followUps.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto whitespace-normal text-left"
                disabled={isSending}
                onClick={() => void sendMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a follow-up about your resume, ATS score, matches, or applications..."
            className="min-h-[88px] resize-none"
            maxLength={2000}
            disabled={isSending}
            aria-label="Career assistant message"
          />
          <Button type="submit" disabled={isSending || !draft.trim()} className="sm:h-[88px] sm:px-6">
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
