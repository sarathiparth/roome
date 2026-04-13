"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

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
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Attach "other" user for convenience
  const enriched = matches.map((m) => ({
    ...m,
    otherUser: m.userA === user.id ? m.profileB : m.profileA,
    lastMessage: m.messages[0] ?? null,
  }))

  return { matches: enriched }
}

// ─── Get messages in a match ──────────────────────────────────────────────────
export async function getMessages(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", messages: [] }

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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  if (!content.trim()) return { error: "Empty message" }

  const message = await prisma.message.create({
    data: { matchId, senderId: user.id, content: content.trim() },
  })

  return { message }
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
    take: 20,
  })

  return { notifications }
}
