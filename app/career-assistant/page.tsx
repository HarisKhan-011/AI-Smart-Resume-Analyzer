import { requireAuth } from "@/lib/auth-utils"
import { getOwnedChatConversation } from "@/services/chat/chat-service"
import { CareerChat } from "@/components/chat/career-chat"
import { PageHeader } from "@/components/shared/page-header"
import { MessageCircle } from "lucide-react"

export default async function CareerAssistantPage() {
  const user = await requireAuth()
  const conversation = await getOwnedChatConversation(user.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Assistant"
        description="Personalized advice from your actual resume, ATS results, job matches, and skill gaps."
        icon={MessageCircle}
      />
      <CareerChat
        initialMessages={conversation.messages.map((item) => ({
          role: item.role,
          content: item.content,
          createdAt: (() => {
            const date = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt)
            return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
          })(),
        }))}
      />
    </div>
  )
}
