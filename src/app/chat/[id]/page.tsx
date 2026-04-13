"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Send, Check, CheckCheck, MoreVertical } from "lucide-react"
import { getMessages, sendMessage, markMessagesRead } from "@/app/chat/actions"
import { useRealtimeMessages, useTypingIndicator, useOnlinePresence } from "@/lib/supabase-realtime"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date | string
  readAt: Date | string | null
}

export default function ChatConversationPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [otherUserName, setOtherUserName] = useState("")
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Real-time hooks
  const { newMessages } = useRealtimeMessages(matchId)
  const { isOtherTyping, sendTypingEvent } = useTypingIndicator(matchId, currentUserId)
  const { isOtherOnline } = useOnlinePresence(matchId, currentUserId)

  // Load initial messages
  useEffect(() => {
    async function load() {
      const result = await getMessages(matchId)
      if (result.messages) {
        setMessages(result.messages as Message[])
      }
      if (result.currentUserId) {
        setCurrentUserId(result.currentUserId)
      }
      setLoading(false)

      // Mark messages as read
      await markMessagesRead(matchId)
    }
    load()
  }, [matchId])

  // Merge real-time messages
  useEffect(() => {
    if (newMessages.length === 0) return

    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id))
      const fresh = newMessages
        .filter((nm) => !existingIds.has(nm.id))
        .map((nm) => ({
          id: nm.id,
          content: nm.content,
          senderId: nm.sender_id,
          createdAt: nm.created_at,
          readAt: nm.read_at,
        }))
      return [...prev, ...fresh]
    })

    // Mark new incoming messages as read
    markMessagesRead(matchId)
  }, [newMessages, matchId])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isOtherTyping])

  // Send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return

    const content = input.trim()
    setInput("")
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId ?? "",
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    setMessages((prev) => [...prev, optimistic])

    const result = await sendMessage(matchId, content)

    if (result.message) {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...result.message!, createdAt: result.message!.createdAt, readAt: result.message!.readAt } as Message : m)),
      )
    }

    setSending(false)
    inputRef.current?.focus()
  }, [input, sending, currentUserId, matchId])

  // Handle typing events
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    sendTypingEvent()
  }

  // Group messages by date
  const groupedMessages = groupByDate(messages)

  if (loading) {
    return (
      <main className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="relative h-full w-full max-w-[430px] bg-[#080808] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 border-2 border-white/20 border-t-white/70 rounded-full"
          />
        </div>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-30 px-4 py-3 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-white/70" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                {otherUserAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={otherUserAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white/40 text-sm font-bold">
                    {(otherUserName || "?")[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              {isOtherOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#080808]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-[16px] truncate">
                {otherUserName || "Chat"}
              </h2>
              <AnimatePresence mode="wait">
                {isOtherTyping ? (
                  <motion.p
                    key="typing"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-emerald-400 text-[11px] font-medium"
                  >
                    typing...
                  </motion.p>
                ) : isOtherOnline ? (
                  <motion.p
                    key="online"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/40 text-[11px]"
                  >
                    Online
                  </motion.p>
                ) : (
                  <motion.p
                    key="offline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/30 text-[11px]"
                  >
                    Offline
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <MoreVertical className="h-4 w-4 text-white/70" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollbarWidth: "none" }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="text-4xl">👋</div>
              <p className="text-white/40 text-sm">
                Start the conversation!
              </p>
            </div>
          ) : (
            <>
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[10px] text-white/30 bg-white/[0.04] px-3 py-1 rounded-full font-medium">
                      {date}
                    </span>
                  </div>
                  {msgs.map((msg, i) => {
                    const isMine = msg.senderId === currentUserId
                    const showAvatar = !isMine && (i === 0 || msgs[i - 1]?.senderId === currentUserId)

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex mb-1 ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl relative ${
                            isMine
                              ? "bg-white text-black rounded-br-md"
                              : "bg-white/[0.08] text-white/90 rounded-bl-md border border-white/[0.06]"
                          }`}
                        >
                          <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isMine ? "text-black/40" : "text-white/30"}`}>
                              {formatTime(new Date(msg.createdAt))}
                            </span>
                            {isMine && (
                              msg.readAt ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-black/30" />
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isOtherTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex justify-start mb-2"
                  >
                    <div className="bg-white/[0.08] px-4 py-3 rounded-2xl rounded-bl-md border border-white/[0.06]">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [-2, 2, -2] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                            className="w-2 h-2 rounded-full bg-white/40"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 px-4 py-3 bg-[#080808]/95 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 h-11 px-4 rounded-full bg-white/[0.06] border border-white/10 text-white text-[14px] placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
              autoComplete="off"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                input.trim()
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/[0.06] text-white/30 border border-white/10"
              }`}
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function groupByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {}
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString()
    const label =
      dateStr === today
        ? "Today"
        : dateStr === yesterday
        ? "Yesterday"
        : new Date(msg.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })

    if (!groups[label]) groups[label] = []
    groups[label].push(msg)
  }

  return groups
}
