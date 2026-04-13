"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NavigationBar } from "@/components/navigation-bar"
import { Search, MessageCircle } from "lucide-react"
import { getMatches } from "@/app/chat/actions"
import { motion } from "motion/react"

interface MatchEntry {
  id: string
  createdAt: Date
  otherUser: {
    id: string
    fullName: string | null
    avatarUrl: string | null
    city: string | null
  }
  lastMessage: {
    content: string
    createdAt: Date
    senderId: string
    readAt: Date | null
  } | null
  unreadCount: number
}

export default function ChatPage() {
  const [matches, setMatches] = useState<MatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await getMatches()
      if (result.matches) {
        setMatches(result.matches as unknown as MatchEntry[])
      }
      if ("currentUserId" in result) {
        setCurrentUserId(result.currentUserId as string)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalUnread = matches.reduce((a, m) => a + m.unreadCount, 0)

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Dark phone column */}
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">
        <NavigationBar />

        {/* Header */}
        <div className="sticky top-0 inset-x-0 z-30 px-5 pt-12 pb-4 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-black text-white tracking-tight">Messages</h1>
            <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Search className="h-4 w-4 text-white/70" />
            </div>
          </div>
          {totalUnread > 0 && (
            <p className="text-emerald-400 text-[13px] mt-1 font-medium">
              {totalUnread} unread message{totalUnread > 1 ? "s" : ""}
            </p>
          )}
          {totalUnread === 0 && matches.length > 0 && (
            <p className="text-white/50 text-[13px] mt-1">All caught up</p>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto pt-2 pb-32" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 border-2 border-white/20 border-t-white/70 rounded-full"
              />
              <span className="text-white/40 text-sm">Loading chats...</span>
            </div>
          ) : matches.length === 0 ? (
            <EmptyChats />
          ) : (
            matches.map((match) => (
              <ChatItem key={match.id} match={match} currentUserId={currentUserId} />
            ))
          )}
        </div>
      </div>
    </main>
  )
}

function ChatItem({ match, currentUserId }: { match: MatchEntry; currentUserId: string | null }) {
  const router = useRouter()
  const isUnread = match.unreadCount > 0
  const other = match.otherUser
  const lastMsg = match.lastMessage

  // Format relative time
  const timeAgo = lastMsg?.createdAt
    ? formatRelativeTime(new Date(lastMsg.createdAt))
    : formatRelativeTime(new Date(match.createdAt))

  // Preview text
  const preview = lastMsg
    ? lastMsg.senderId === currentUserId
      ? `You: ${lastMsg.content}`
      : lastMsg.content
    : "Say hello! 👋"

  return (
    <div
      onClick={() => router.push(`/chat/${match.id}`)}
      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/5 active:bg-white/[0.06]"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center">
          {other.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.avatarUrl} alt={other.fullName ?? ""} className="w-full h-full object-cover object-top" />
          ) : (
            <span className="text-white/40 text-lg font-bold">
              {(other.fullName ?? "?")[0]?.toUpperCase()}
            </span>
          )}
        </div>
        {isUnread && (
          <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-emerald-400 rounded-full border-2 border-[#080808] flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">{match.unreadCount}</span>
          </div>
        )}
      </div>

      {/* Message Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className={`text-[16px] truncate ${isUnread ? "text-white font-bold" : "text-white/90 font-medium"}`}>
            {other.fullName?.split(" ")[0] ?? "Unknown"}
          </h3>
          <span className={`text-[11px] shrink-0 ml-2 ${isUnread ? "text-emerald-400 font-medium" : "text-white/40"}`}>
            {timeAgo}
          </span>
        </div>
        <p className={`text-[13px] truncate ${isUnread ? "text-white/90 font-medium" : "text-white/50 font-normal"}`}>
          {preview}
        </p>
      </div>
    </div>
  )
}

function EmptyChats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center"
    >
      <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <MessageCircle className="h-8 w-8 text-white/30" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">No matches yet</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          When you and someone both like each other, you&apos;ll see them here.
          Keep exploring!
        </p>
      </div>
    </motion.div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
