"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { validate, updateProfileSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"

// ─── Get my profile ───────────────────────────────────────────────────────────
export async function getMyProfile() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", profile: null }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      listings: {
        where: { isActive: true },
        take: 1,
        include: { coRoommates: true },
      },
      vibeResponse: true,
    },
  })

  return { profile }
}

// ─── Update profile fields ────────────────────────────────────────────────────
export async function updateProfile(data: {
  bio?: string
  instagram?: string
  budget?: number
  hasPet?: boolean
  petDescription?: string
  tags?: string[]
}) {
  const v = validate(updateProfileSchema, data)
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await prisma.profile.update({
    where: { id: user.id },
    data: v.data,
  })

  logger.info("profile_updated", { userId: user.id, fields: Object.keys(v.data) })
  revalidatePath("/profile")
  return { success: true }
}
