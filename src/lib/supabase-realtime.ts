/**
 * Supabase Realtime hooks for live chat messaging,
 * typing indicators, and online presence.
 *
 * - useRealtimeMessages: Subscribes to Postgres Changes on the messages table
 * - useTypingIndicator: Uses Broadcast for ephemeral typing events
 * - useOnlinePresence: Uses Presence for online/offline status
 */

"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RealtimeMessage {
  id: string
  match_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

// ─── useRealtimeMessages ──────────────────────────────────────────────────────
// Subscribes to new messages on a specific match via Postgres Changes.
// Returns an array of new messages that arrive after initial load.
export function useRealtimeMessages(matchId: string | null) {
  const [newMessages, setNewMessages] = useState<RealtimeMessage[]>([])
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!matchId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const msg = payload.new as RealtimeMessage
          setNewMessages((prev) => [...prev, msg])
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const updated = payload.new as RealtimeMessage
          setNewMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          )
        },
      )
      .subscribe((s) => {
        setStatus(s === "SUBSCRIBED" ? "connected" : "connecting")
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setStatus("disconnected")
    }
  }, [matchId])

  const clearNewMessages = useCallback(() => setNewMessages([]), [])

  return { newMessages, status, clearNewMessages }
}

// ─── useTypingIndicator ───────────────────────────────────────────────────────
// Uses Supabase Broadcast for ephemeral "user is typing" events.
export function useTypingIndicator(matchId: string | null, currentUserId: string | null) {
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!matchId || !currentUserId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`typing:${matchId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId !== currentUserId) {
          setIsOtherTyping(true)

          // Clear after 3 seconds of no typing events
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [matchId, currentUserId])

  const sendTypingEvent = useCallback(() => {
    if (!channelRef.current || !currentUserId) return
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    })
  }, [currentUserId])

  return { isOtherTyping, sendTypingEvent }
}

// ─── useOnlinePresence ────────────────────────────────────────────────────────
// Track which users are currently online using Supabase Presence.
export function useOnlinePresence(matchId: string | null, currentUserId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!matchId || !currentUserId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`presence:${matchId}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users = Object.values(state)
          .flat()
          .map((p: any) => p.userId as string)
        setOnlineUsers([...new Set(users)])
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: currentUserId })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, currentUserId])

  return { onlineUsers, isOtherOnline: onlineUsers.some((id) => id !== currentUserId) }
}
