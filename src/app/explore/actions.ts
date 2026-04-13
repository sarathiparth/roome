"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { validate, recordSwipeSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { computeCompatibility, batchScore, type VibeResponses } from "@/lib/compatibility"

// ─── Get explore feed (ML-scored) ─────────────────────────────────────────────
// Returns profiles the current user hasn't swiped on, sorted by compatibility.
export async function getExploreFeed(filters?: {
  budgetMin?: number
  budgetMax?: number
  sleepSchedule?: string
  cleanliness?: string
  smoking?: string
  drinking?: string
  housingIntent?: string
  city?: string
  hasPet?: boolean
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", profiles: [] }

  const start = performance.now()

  // Fetch current user's profile + vibe
  const currentProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { vibeResponse: true },
  })

  if (!currentProfile) return { error: "Profile not found", profiles: [] }

  // IDs already swiped
  const swiped = await prisma.swipe.findMany({
    where: { swiperId: user.id },
    select: { swipedId: true },
  })
  const swipedIds = swiped.map((s) => s.swipedId)

  // Build dynamic where clause from filters
  const where: Record<string, unknown> = {
    id: { notIn: [...swipedIds, user.id] },
    onboardingCompleted: true,
  }

  if (filters?.city) where.city = { contains: filters.city, mode: "insensitive" }
  if (filters?.sleepSchedule) where.sleepSchedule = filters.sleepSchedule
  if (filters?.cleanliness) where.cleanliness = filters.cleanliness
  if (filters?.smoking) where.smoking = filters.smoking
  if (filters?.drinking) where.drinking = filters.drinking
  if (filters?.housingIntent) where.housingIntent = filters.housingIntent
  if (filters?.hasPet !== undefined) where.hasPet = filters.hasPet
  if (filters?.budgetMin || filters?.budgetMax) {
    where.budget = {
      ...(filters?.budgetMin ? { gte: filters.budgetMin } : {}),
      ...(filters?.budgetMax ? { lte: filters.budgetMax } : {}),
    }
  }

  // Fetch candidates
  const candidates = await prisma.profile.findMany({
    where: where as any,
    include: {
      vibeResponse: true,
      listings: {
        where: { isActive: true },
        take: 1,
        select: {
          id: true,
          location: true,
          rent: true,
          deposit: true,
          propertyType: true,
          roomType: true,
          furnishing: true,
          amenities: true,
          photos: true,
          occCurrent: true,
          occTotal: true,
          occAvailable: true,
        },
      },
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  })

  // Build current user profile for scorer
  const currentUserProfile = {
    id: currentProfile.id,
    sleepSchedule: currentProfile.sleepSchedule,
    cleanliness: currentProfile.cleanliness,
    smoking: currentProfile.smoking,
    drinking: currentProfile.drinking,
    housingIntent: currentProfile.housingIntent,
    budget: currentProfile.budget,
    hasPet: currentProfile.hasPet,
    moveInDate: currentProfile.moveInDate,
    moveInFlexible: currentProfile.moveInFlexible,
    tags: currentProfile.tags,
    vibeResponses: currentProfile.vibeResponse?.responses as VibeResponses | null,
  }

  // Score all candidates
  const scored = batchScore(
    currentUserProfile,
    currentUserProfile.vibeResponses,
    candidates.map((c) => ({
      profile: {
        id: c.id,
        sleepSchedule: c.sleepSchedule,
        cleanliness: c.cleanliness,
        smoking: c.smoking,
        drinking: c.drinking,
        housingIntent: c.housingIntent,
        budget: c.budget,
        hasPet: c.hasPet,
        moveInDate: c.moveInDate,
        moveInFlexible: c.moveInFlexible,
        tags: c.tags,
        vibeResponses: c.vibeResponse?.responses as VibeResponses | null,
      },
      vibe: c.vibeResponse?.responses as VibeResponses | null,
    })),
  )

  // Build enriched profiles for the UI
  const profiles = scored
    .filter((s) => s.compatibility.compatible || s.compatibility.compatibilityPct >= 30)
    .map((s) => {
      const candidate = candidates.find((c) => c.id === s.profile.id)!
      return {
        id: candidate.id,
        fullName: candidate.fullName,
        avatarUrl: candidate.avatarUrl,
        dob: candidate.dob,
        gender: candidate.gender,
        city: candidate.city,
        country: candidate.country,
        occupation: candidate.occupation,
        college: candidate.college,
        company: candidate.company,
        bio: candidate.bio,
        instagram: candidate.instagram,
        tags: candidate.tags,
        housingIntent: candidate.housingIntent,
        sleepSchedule: candidate.sleepSchedule,
        cleanliness: candidate.cleanliness,
        smoking: candidate.smoking,
        drinking: candidate.drinking,
        budget: candidate.budget,
        hasPet: candidate.hasPet,
        petDescription: candidate.petDescription,
        moveInDate: candidate.moveInDate,
        moveInFlexible: candidate.moveInFlexible,
        listing: candidate.listings[0] ?? null,
        // ML scores
        matchScore: s.compatibility.compatibilityPct,
        sectionScores: s.compatibility.sectionScores,
        compatible: s.compatibility.compatible,
        rejectionReason: s.compatibility.rejectionReason,
      }
    })

  const elapsed = Math.round(performance.now() - start)

  logger.info("explore_feed_loaded", {
    userId: user.id,
    candidateCount: candidates.length,
    scoredCount: profiles.length,
    latencyMs: elapsed,
  })

  return { profiles }
}

// ─── Record a swipe ───────────────────────────────────────────────────────────
// Atomic: Swipe + Match + 2 Notifications in a single transaction.
export async function recordSwipe(
  swipedId: string,
  direction: "like" | "pass" | "super"
) {
  const v = validate(recordSwipeSchema, { swipedId, direction })
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Note: Prisma v7 pg adapter doesn't support interactive transactions.
  // Sequential queries used with idempotency checks for safety.

  // 1. Upsert the swipe
  await prisma.swipe.upsert({
    where: { swiperId_swipedId: { swiperId: user.id, swipedId } },
    create: { swiperId: user.id, swipedId, direction },
    update: { direction },
  })

  // 2. Log ML feedback for continuous learning
  if (direction === "pass") {
    logger.info("ml_feedback_negative", {
      swiperId: user.id,
      swipedId,
      action: "pass",
    })
    return { matched: false }
  }

  // 3. Check for reciprocal like/super
  const reciprocal = await prisma.swipe.findUnique({
    where: { swiperId_swipedId: { swiperId: swipedId, swipedId: user.id } },
  })

  const isMatch =
    reciprocal && ["like", "super"].includes(reciprocal.direction)

  if (!isMatch) {
    return { matched: false }
  }

  // 4. Create Match (order IDs for unique constraint)
  const [userA, userB] =
    user.id < swipedId ? [user.id, swipedId] : [swipedId, user.id]

  // Idempotency check
  const existingMatch = await prisma.match.findUnique({
    where: { userA_userB: { userA, userB } },
  })

  if (existingMatch) {
    return { matched: true, matchId: existingMatch.id }
  }

  const match = await prisma.match.create({
    data: { userA, userB },
  })

  // 5. Fetch profiles for notification payload
  const [profileA, profileB] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id }, select: { fullName: true, avatarUrl: true } }),
    prisma.profile.findUnique({ where: { id: swipedId }, select: { fullName: true, avatarUrl: true } }),
  ])

  // 6. Create notifications for both users
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "match",
        payload: {
          matchId: match.id,
          otherUserId: swipedId,
          otherUserName: profileB?.fullName ?? "Someone",
          otherUserAvatar: profileB?.avatarUrl,
        },
      },
      {
        userId: swipedId,
        type: "match",
        payload: {
          matchId: match.id,
          otherUserId: user.id,
          otherUserName: profileA?.fullName ?? "Someone",
          otherUserAvatar: profileA?.avatarUrl,
        },
      },
    ],
  })

  // 7. Log positive ML feedback
  logger.info("ml_feedback_positive", {
    swiperId: user.id,
    swipedId,
    action: direction,
    matched: true,
  })

  logger.info("match_created", { matchId: match.id, userA, userB })
  return { matched: true, matchId: match.id }
}

// ─── Undo last swipe ──────────────────────────────────────────────────────────
export async function undoLastSwipe() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const lastSwipe = await prisma.swipe.findFirst({
    where: { swiperId: user.id },
    orderBy: { createdAt: "desc" },
  })

  if (!lastSwipe) return { error: "No swipes to undo" }

  // Sequential queries (no interactive tx in Prisma v7 pg adapter)
  await prisma.swipe.delete({ where: { id: lastSwipe.id } })

  if (["like", "super"].includes(lastSwipe.direction)) {
    const [userA, userB] =
      user.id < lastSwipe.swipedId
        ? [user.id, lastSwipe.swipedId]
        : [lastSwipe.swipedId, user.id]

    const match = await prisma.match.findUnique({
      where: { userA_userB: { userA, userB } },
    })

    if (match) {
      await prisma.notification.deleteMany({
        where: {
          type: "match",
          payload: { path: ["matchId"], equals: match.id },
        },
      })
      await prisma.match.delete({ where: { id: match.id } })
      logger.info("match_undone", { matchId: match.id, userId: user.id })
    }
  }

  logger.info("swipe_undone", { userId: user.id, swipedId: lastSwipe.swipedId })
  return { undoneSwipedId: lastSwipe.swipedId }
}

// ─── Get profiles that liked you ──────────────────────────────────────────────
export async function getLikedYouProfiles() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { profiles: [] }

  // Find swipes where someone liked/super'd the current user
  // but the current user hasn't swiped them back yet
  const incomingLikes = await prisma.swipe.findMany({
    where: {
      swipedId: user.id,
      direction: { in: ["like", "super"] },
      swiper: {
        swipesReceived: {
          none: { swiperId: user.id },
        },
      },
    },
    include: {
      swiper: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          city: true,
          occupation: true,
          bio: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return {
    profiles: incomingLikes.map((s) => ({
      ...s.swiper,
      swipeDirection: s.direction,
      swipedAt: s.createdAt,
    })),
  }
}
