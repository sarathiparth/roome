"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

// ─── Get explore feed ─────────────────────────────────────────────────────────
// Returns profiles the current user hasn't swiped on yet.
export async function getExploreFeed() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", profiles: [] }

  // IDs already swiped by this user
  const swiped = await prisma.swipe.findMany({
    where: { swiperId: user.id },
    select: { swipedId: true },
  })
  const swipedIds = swiped.map((s) => s.swipedId)

  const profiles = await prisma.profile.findMany({
    where: {
      id: { notIn: [...swipedIds, user.id] },
      onboardingCompleted: true,
    },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      city: true,
      occupation: true,
      college: true,
      company: true,
      bio: true,
      tags: true,
      housingIntent: true,
      sleepSchedule: true,
      cleanliness: true,
      smoking: true,
      drinking: true,
      moveInDate: true,
      moveInFlexible: true,
      budget: true,
      hasPet: true,
      listings: {
        where: { isActive: true },
        take: 1,
        select: {
          id: true,
          location: true,
          rent: true,
          propertyType: true,
          photos: true,
        },
      },
    },
    take: 30,
    orderBy: { createdAt: "desc" },
  })

  return { profiles }
}

// ─── Record a swipe ───────────────────────────────────────────────────────────
export async function recordSwipe(
  swipedId: string,
  direction: "like" | "pass" | "super"
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await prisma.swipe.upsert({
    where: { swiperId_swipedId: { swiperId: user.id, swipedId } },
    create: { swiperId: user.id, swipedId, direction },
    update: { direction },
  })

  // Check if it's a match (mutual like)
  const reciprocalSwipe = await prisma.swipe.findUnique({
    where: { swiperId_swipedId: { swiperId: swipedId, swipedId: user.id } },
  })

  const isMatch =
    reciprocalSwipe &&
    ["like", "super"].includes(reciprocalSwipe.direction) &&
    ["like", "super"].includes(direction)

  return { matched: isMatch }
}
