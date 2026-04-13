/**
 * Compatibility Prediction API
 *
 * GET /api/v1/match/predict?userA=<uuid>&userB=<uuid>
 * POST /api/v1/match/predict { userAId, userBId }
 *
 * Returns compatibility score + section breakdown.
 * Uses the lightweight TypeScript scorer for <100ms response.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { computeCompatibility } from "@/lib/compatibility"
import { logger } from "@/lib/logger"
import { z } from "zod"

const requestSchema = z.object({
  userAId: z.string().uuid(),
  userBId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { userAId, userBId } = parsed.data

    // Ensure the requesting user is one of the pair
    if (user.id !== userAId && user.id !== userBId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const start = performance.now()

    // Fetch both profiles + vibe responses
    const [profileA, profileB] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: userAId },
        include: { vibeResponse: true },
      }),
      prisma.profile.findUnique({
        where: { id: userBId },
        include: { vibeResponse: true },
      }),
    ])

    if (!profileA || !profileB) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Map to scorer input
    const userA = {
      id: profileA.id,
      sleepSchedule: profileA.sleepSchedule,
      cleanliness: profileA.cleanliness,
      smoking: profileA.smoking,
      drinking: profileA.drinking,
      housingIntent: profileA.housingIntent,
      budget: profileA.budget,
      hasPet: profileA.hasPet,
      moveInDate: profileA.moveInDate,
      moveInFlexible: profileA.moveInFlexible,
      tags: profileA.tags,
      vibeResponses: profileA.vibeResponse?.responses as Record<string, number> | null,
    }

    const userB = {
      id: profileB.id,
      sleepSchedule: profileB.sleepSchedule,
      cleanliness: profileB.cleanliness,
      smoking: profileB.smoking,
      drinking: profileB.drinking,
      housingIntent: profileB.housingIntent,
      budget: profileB.budget,
      hasPet: profileB.hasPet,
      moveInDate: profileB.moveInDate,
      moveInFlexible: profileB.moveInFlexible,
      tags: profileB.tags,
      vibeResponses: profileB.vibeResponse?.responses as Record<string, number> | null,
    }

    const result = computeCompatibility(
      userA,
      userB,
      userA.vibeResponses,
      userB.vibeResponses,
    )

    const elapsed = Math.round(performance.now() - start)

    logger.info("compatibility_scored", {
      userAId,
      userBId,
      score: result.compatibilityPct,
      latencyMs: elapsed,
    })

    return NextResponse.json({
      compatibilityPct: result.compatibilityPct,
      compatible: result.compatible,
      sectionScores: result.sectionScores,
      rejectionReason: result.rejectionReason,
      latencyMs: elapsed,
    })
  } catch (err) {
    logger.error("compatibility_error", {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userAId = searchParams.get("userA")
  const userBId = searchParams.get("userB")

  if (!userAId || !userBId) {
    return NextResponse.json(
      { error: "userA and userB query params required" },
      { status: 400 },
    )
  }

  // Delegate to POST handler logic
  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ userAId, userBId }),
    headers: request.headers,
  })

  return POST(fakeRequest)
}
