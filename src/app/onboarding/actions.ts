"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

// ─── Save onboarding profile ──────────────────────────────────────────────────
export async function saveOnboardingProfile(data: {
  occupation?: string
  college?: string
  company?: string
  city?: string
  country?: string
  instagram?: string
  bio?: string
  moveInDate?: string
  moveInFlexible?: boolean
  sleepSchedule?: string
  cleanliness?: string
  smoking?: string
  drinking?: string
  roommatePref?: string
  housingIntent?: string
  // Listing fields (only if have_room)
  propLocation?: string
  propType?: string
  propRoomType?: string
  propFurnishing?: string
  occCurrent?: number
  occTotal?: number
  occAvailable?: number
  rent?: number
  deposit?: number
  propMoveInDate?: string
  amenities?: string[]
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Upsert profile
  await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      fullName: user.user_metadata?.full_name || "",
      occupation: data.occupation,
      college: data.college,
      company: data.company,
      city: data.city,
      country: data.country,
      instagram: data.instagram,
      bio: data.bio,
      moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
      moveInFlexible: data.moveInFlexible ?? false,
      sleepSchedule: data.sleepSchedule,
      cleanliness: data.cleanliness,
      smoking: data.smoking,
      drinking: data.drinking,
      roommatePref: data.roommatePref,
      housingIntent: data.housingIntent,
      onboardingCompleted: true,
    },
    update: {
      occupation: data.occupation,
      college: data.college,
      company: data.company,
      city: data.city,
      country: data.country,
      instagram: data.instagram,
      bio: data.bio,
      moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
      moveInFlexible: data.moveInFlexible ?? false,
      sleepSchedule: data.sleepSchedule,
      cleanliness: data.cleanliness,
      smoking: data.smoking,
      drinking: data.drinking,
      roommatePref: data.roommatePref,
      housingIntent: data.housingIntent,
      onboardingCompleted: true,
    },
  })

  // Create / update listing if user has a room
  if (data.housingIntent === "have_room") {
    const existing = await prisma.listing.findFirst({
      where: { ownerId: user.id },
    })

    const listingData = {
      location: data.propLocation,
      propertyType: data.propType,
      roomType: data.propRoomType,
      furnishing: data.propFurnishing,
      occCurrent: data.occCurrent ?? 1,
      occTotal: data.occTotal ?? 2,
      occAvailable: data.occAvailable ?? 1,
      rent: data.rent,
      deposit: data.deposit,
      moveInDate: data.propMoveInDate ? new Date(data.propMoveInDate) : null,
      amenities: data.amenities ?? [],
    }

    if (existing) {
      await prisma.listing.update({ where: { id: existing.id }, data: listingData })
    } else {
      await prisma.listing.create({ data: { ownerId: user.id, ...listingData } })
    }
  }

  revalidatePath("/profile")
  redirect("/explore")
}

// ─── Upload avatar ────────────────────────────────────────────────────────────
export async function uploadAvatar(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("avatar") as File
  if (!file) return { error: "No file provided" }

  const ext = file.name.split(".").pop()
  const path = `${user.id}/avatar.${ext}`

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(path)

  await prisma.profile.update({
    where: { id: user.id },
    data: { avatarUrl: publicUrl },
  })

  return { url: publicUrl }
}
