"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Get my profile ───────────────────────────────────────────────────────────
export async function getMyProfile() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", profile: null }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      listings: { where: { isActive: true }, take: 1 },
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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await prisma.profile.update({
    where: { id: user.id },
    data,
  })

  revalidatePath("/profile")
  return { success: true }
}
