"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { validate, sendMessageSchema, markReadSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { moderateMessage } from "@/lib/safety"

// ─── Get all matches with last message ────────────────────────────────────────
export async function getMatches() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", matches: [] }

  const matches = await prisma.match.findMany({
    where: { OR: [{ userA: user.id }, { userB: user.id }] },
    include: {
      profileA: { select: { id: true, fullName: true, avatarUrl: true, city: true } },
      profileB: { select: { id: true, fullName: true, avatarUrl: true, city: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true, readAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Count unread messages per match
  const unreadCounts = await Promise.all(
    matches.map((m) =>
      prisma.message.count({
        where: {
          matchId: m.id,
          senderId: { not: user.id },
          readAt: null,
        },
      }),
    ),
  )

  // Attach "other" user + unread count for convenience
  const enriched = matches.map((m, i) => ({
    id: m.id,
    createdAt: m.createdAt,
    otherUser: m.userA === user.id ? m.profileB : m.profileA,
    lastMessage: m.messages[0] ?? null,
    unreadCount: unreadCounts[i],
  }))

  return { matches: enriched, currentUserId: user.id }
}

// ─── Get messages in a match ──────────────────────────────────────────────────
export async function getMessages(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", messages: [] }

  // Verify user is part of this match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { userA: true, userB: true },
  })

  if (!match || (match.userA !== user.id && match.userB !== user.id)) {
    return { error: "Unauthorized", messages: [] }
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      senderId: true,
      createdAt: true,
      readAt: true,
    },
  })

  return { messages, currentUserId: user.id }
}

// ─── Send a message ───────────────────────────────────────────────────────────
export async function sendMessage(matchId: string, content: string) {
  const v = validate(sendMessageSchema, { matchId, content })
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify user is part of this match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { userA: true, userB: true },
  })

  if (!match || (match.userA !== user.id && match.userB !== user.id)) {
    return { error: "Unauthorized" }
  }

  const message = await prisma.message.create({
    data: { matchId, senderId: user.id, content: v.data.content },
  })

  // Create notification for the other user
  const otherUserId = match.userA === user.id ? match.userB : match.userA
  const sender = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true },
  })

  await prisma.notification.create({
    data: {
      userId: otherUserId,
      type: "message",
      payload: {
        matchId,
        senderId: user.id,
        senderName: sender?.fullName ?? "Someone",
        preview: v.data.content.slice(0, 60),
      },
    },
  })

  logger.info("message_sent", {
    matchId,
    senderId: user.id,
    contentLength: v.data.content.length,
  })

  // Background safety scan — non-blocking, flags stored in DB
  moderateMessage(message.id, matchId, user.id, v.data.content).catch((err) => {
    logger.error("moderation_scan_failed", { messageId: message.id, error: String(err) })
  })

  return { message }
}

// ─── Mark messages as read ────────────────────────────────────────────────────
export async function markMessagesRead(matchId: string) {
  const v = validate(markReadSchema, { matchId })
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const updated = await prisma.message.updateMany({
    where: {
      matchId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  logger.debug("messages_marked_read", {
    matchId,
    userId: user.id,
    count: updated.count,
  })

  return { count: updated.count }
}

// ─── Get notifications ────────────────────────────────────────────────────────
export async function getNotifications() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notifications: [] }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return { notifications }
}

// ─── Mark notification as read ────────────────────────────────────────────────
export async function markNotificationRead(notificationId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await prisma.notification.update({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  })

  return { success: true }
}
