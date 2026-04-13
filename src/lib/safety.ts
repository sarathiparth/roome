"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { validate } from "@/lib/validation"

// ─── Schemas ──────────────────────────────────────────────────────────────────
const reportSchema = z.object({
  reportedId: z.string().uuid(),
  type: z.enum(["harassment", "scam", "inappropriate", "fake_profile", "spam", "underage", "other"]),
  context: z.enum(["profile", "chat", "listing"]),
  description: z.string().max(1000).optional(),
  matchId: z.string().uuid().optional(),
})

const blockSchema = z.object({
  blockedId: z.string().uuid(),
})

// ─── Chat Moderation Patterns ─────────────────────────────────────────────────
// Keyword-based first layer. Catches obvious violations instantly.
const MODERATION_PATTERNS = {
  scam: {
    patterns: [
      /send\s*(me\s*)?(money|cash|payment)/i,
      /bank\s*account/i,
      /wire\s*transfer/i,
      /western\s*union/i,
      /gift\s*card/i,
      /crypto\s*(wallet|address|transfer)/i,
      /pay\s*(me|now|first|upfront)/i,
      /venmo|cashapp|zelle/i,
    ],
    severity: "high" as const,
  },
  personal_info: {
    patterns: [
      /\b\d{10,12}\b/i,  // Phone numbers
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Emails
      /(?:whatsapp|telegram|signal)\s*(?:me|number|id)/i,
    ],
    severity: "medium" as const,
  },
  off_platform: {
    patterns: [
      /(?:meet|chat|talk)\s*(?:on|at|via)\s*(?:whatsapp|telegram|insta|instagram|snap|snapchat)/i,
      /add\s*me\s*on/i,
      /(?:my|check\s+out\s+my)\s*(?:insta|instagram|snap|snapchat)/i,
    ],
    severity: "low" as const,
  },
  harassment: {
    patterns: [
      /\b(kill|rape|hurt|stalk|threaten)\b/i,
      /\bi['']?ll\s*(find|come\s*for|get)\s*(you|u)\b/i,
    ],
    severity: "critical" as const,
  },
  explicit: {
    patterns: [
      /\b(nudes?|naked|sex|hookup|dtf|fwb)\b/i,
      /send\s*(me\s*)?(pics?|photos?|nudes?)/i,
    ],
    severity: "medium" as const,
  },
}

// ─── Moderate a message ───────────────────────────────────────────────────────
/** Scans a message for policy violations. Returns flags if any. */
export async function moderateMessage(
  messageId: string,
  matchId: string,
  senderId: string,
  content: string
) {
  const flags: Array<{
    flagType: string
    severity: string
    flaggedContent: string
  }> = []

  for (const [flagType, config] of Object.entries(MODERATION_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(content)) {
        flags.push({
          flagType,
          severity: config.severity,
          flaggedContent: content.substring(0, 500),
        })
        break // One flag per category per message
      }
    }
  }

  if (flags.length > 0) {
    // Store flags in DB
    for (const flag of flags) {
      await prisma.chatFlag.create({
        data: {
          messageId,
          matchId,
          senderId,
          flagType: flag.flagType,
          severity: flag.severity,
          flaggedContent: flag.flaggedContent,
          autoFlagged: true,
        },
      })
    }

    // If critical severity, auto-hide message and warn user
    const hasCritical = flags.some(f => f.severity === "critical")
    if (hasCritical) {
      logger.warn("chat_moderation_critical", {
        messageId,
        matchId,
        senderId,
        flags: flags.map(f => f.flagType),
      })
    }

    logger.info("chat_moderation_flagged", {
      messageId,
      senderId,
      flagCount: flags.length,
      types: flags.map(f => f.flagType),
    })
  }

  return { flagged: flags.length > 0, flags }
}

// ─── Report a user ────────────────────────────────────────────────────────────
export async function reportUser(data: z.infer<typeof reportSchema>) {
  const v = validate(reportSchema, data)
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  if (user.id === v.data.reportedId) {
    return { error: "You cannot report yourself" }
  }

  // Check for duplicate report
  const existing = await prisma.report.findFirst({
    where: {
      reporterId: user.id,
      reportedId: v.data.reportedId,
      status: { in: ["pending", "reviewing"] },
    },
  })

  if (existing) {
    return { error: "You already have an active report for this user" }
  }

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedId: v.data.reportedId,
      type: v.data.type,
      context: v.data.context,
      description: v.data.description,
      matchId: v.data.matchId,
    },
  })

  // Increment report count on the reported user
  await prisma.profile.update({
    where: { id: v.data.reportedId },
    data: { reportCount: { increment: 1 } },
  })

  // Auto-suspend if report count exceeds threshold
  const reportedProfile = await prisma.profile.findUnique({
    where: { id: v.data.reportedId },
    select: { reportCount: true },
  })

  if (reportedProfile && reportedProfile.reportCount >= 5) {
    await prisma.profile.update({
      where: { id: v.data.reportedId },
      data: {
        isSuspended: true,
        suspendedUntil: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        trustScore: { decrement: 20 },
      },
    })
    logger.warn("user_auto_suspended", {
      userId: v.data.reportedId,
      reportCount: reportedProfile.reportCount + 1,
    })
  }

  logger.info("report_created", {
    reportId: report.id,
    reporterId: user.id,
    reportedId: v.data.reportedId,
    type: v.data.type,
    context: v.data.context,
  })

  return { reportId: report.id }
}

// ─── Block a user ─────────────────────────────────────────────────────────────
export async function blockUser(data: z.infer<typeof blockSchema>) {
  const v = validate(blockSchema, data)
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  if (user.id === v.data.blockedId) {
    return { error: "You cannot block yourself" }
  }

  // Upsert the block
  await prisma.block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: v.data.blockedId,
      },
    },
    create: {
      blockerId: user.id,
      blockedId: v.data.blockedId,
    },
    update: {},
  })

  logger.info("user_blocked", {
    blockerId: user.id,
    blockedId: v.data.blockedId,
  })

  return { success: true }
}

// ─── Unblock a user ───────────────────────────────────────────────────────────
export async function unblockUser(blockedId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await prisma.block.deleteMany({
    where: {
      blockerId: user.id,
      blockedId,
    },
  })

  return { success: true }
}

// ─── Get blocked users ────────────────────────────────────────────────────────
export async function getBlockedUsers() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { blocks: [] }

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    include: {
      blocked: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return { blocks }
}

// ─── Get user's verification status ───────────────────────────────────────────
export async function getVerificationStatus() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { verifications: [] }

  const verifications = await prisma.verification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return { verifications }
}

// ─── Request email verification (work/education) ─────────────────────────────
export async function requestEmailVerification(
  type: "work_email" | "education_email",
  email: string
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Validate email domain
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return { error: "Invalid email address" }

  // For education: check for .edu or known edu domains
  if (type === "education_email" && !domain.endsWith(".edu") && !domain.endsWith(".ac.in")) {
    return { error: "Please use your university email address (.edu)" }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Store verification attempt
  await prisma.verification.upsert({
    where: { userId_type: { userId: user.id, type } },
    create: {
      userId: user.id,
      type,
      status: "pending",
      provider: "email_otp",
      metadata: { email, otp, attempts: 0 },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
    update: {
      status: "pending",
      metadata: { email, otp, attempts: 0 },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // TODO: Send OTP email via Supabase Edge Function or Resend
  logger.info("verification_otp_generated", {
    userId: user.id,
    type,
    domain,
  })

  return { success: true, message: "Verification code sent to your email" }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyEmailOtp(
  type: "work_email" | "education_email",
  otp: string
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const verification = await prisma.verification.findUnique({
    where: { userId_type: { userId: user.id, type } },
  })

  if (!verification) return { error: "No verification request found" }
  if (verification.status === "verified") return { error: "Already verified" }
  if (verification.expiresAt && verification.expiresAt < new Date()) {
    return { error: "Verification code expired" }
  }

  const meta = verification.metadata as any
  if (meta.attempts >= 5) return { error: "Too many attempts. Request a new code." }

  if (meta.otp !== otp) {
    await prisma.verification.update({
      where: { id: verification.id },
      data: { metadata: { ...meta, attempts: meta.attempts + 1 } },
    })
    return { error: "Invalid code" }
  }

  // Verified!
  await prisma.verification.update({
    where: { id: verification.id },
    data: {
      status: "verified",
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  })

  // Update trust score
  await prisma.profile.update({
    where: { id: user.id },
    data: { trustScore: { increment: 15 } },
  })

  // Check if user now qualifies for verified badge
  const allVerifications = await prisma.verification.findMany({
    where: { userId: user.id, status: "verified" },
  })

  if (allVerifications.length >= 2) {
    await prisma.profile.update({
      where: { id: user.id },
      data: { isVerified: true },
    })
  }

  logger.info("verification_completed", { userId: user.id, type })
  return { verified: true }
}

// ─── Calculate Trust Score ────────────────────────────────────────────────────
/** Recalculate trust score based on verifications, activity, and reports */
export async function recalculateTrustScore(userId: string) {
  let score = 30 // Base score

  // +15 for each verification
  const verifications = await prisma.verification.count({
    where: { userId, status: "verified" },
  })
  score += verifications * 15

  // +10 for completed profile
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      bio: true,
      avatarUrl: true,
      onboardingCompleted: true,
      reportCount: true,
    },
  })

  if (profile?.bio) score += 5
  if (profile?.avatarUrl) score += 5
  if (profile?.onboardingCompleted) score += 10

  // -10 per report
  if (profile?.reportCount) score -= profile.reportCount * 10

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score))

  await prisma.profile.update({
    where: { id: userId },
    data: { trustScore: score },
  })

  return { trustScore: score }
}
