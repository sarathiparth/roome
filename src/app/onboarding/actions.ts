"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { validate, onboardingProfileSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"
import type { OnboardingProfileInput } from "@/lib/validation"

// ─── Save onboarding profile ──────────────────────────────────────────────────
export async function saveOnboardingProfile(data: OnboardingProfileInput) {
  const v = validate(onboardingProfileSchema, data)
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const d = v.data

  // Note: Prisma v7 with pg adapter doesn't support interactive transactions.
  // We use sequential queries instead (acceptable for onboarding — single user).

  // 1. Upsert profile
  await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      fullName: user.user_metadata?.full_name || "",
      occupation: d.occupation,
      college: d.college,
      company: d.company,
      city: d.city,
      country: d.country,
      instagram: d.instagram,
      bio: d.bio,
      moveInDate: d.moveInDate ? new Date(d.moveInDate) : null,
      moveInFlexible: d.moveInFlexible ?? false,
      sleepSchedule: d.sleepSchedule,
      cleanliness: d.cleanliness,
      smoking: d.smoking,
      drinking: d.drinking,
      roommatePref: d.roommatePref,
      housingIntent: d.housingIntent,
      onboardingCompleted: true,
    },
    update: {
      occupation: d.occupation,
      college: d.college,
      company: d.company,
      city: d.city,
      country: d.country,
      instagram: d.instagram,
      bio: d.bio,
      moveInDate: d.moveInDate ? new Date(d.moveInDate) : null,
      moveInFlexible: d.moveInFlexible ?? false,
      sleepSchedule: d.sleepSchedule,
      cleanliness: d.cleanliness,
      smoking: d.smoking,
      drinking: d.drinking,
      roommatePref: d.roommatePref,
      housingIntent: d.housingIntent,
      onboardingCompleted: true,
    },
  })

  // 2. Create / update listing if user has a room
  if (d.housingIntent === "have_room") {
    const existing = await prisma.listing.findFirst({
      where: { ownerId: user.id },
    })

    const listingData = {
      location: d.propLocation,
      propertyType: d.propType,
      roomType: d.propRoomType,
      furnishing: d.propFurnishing,
      occCurrent: d.occCurrent ?? 1,
      occTotal: d.occTotal ?? 2,
      occAvailable: d.occAvailable ?? 1,
      rent: d.rent,
      deposit: d.deposit,
      moveInDate: d.propMoveInDate ? new Date(d.propMoveInDate) : null,
      amenities: d.amenities ?? [],
    }

    let listingId: string

    if (existing) {
      await prisma.listing.update({ where: { id: existing.id }, data: listingData })
      listingId = existing.id
    } else {
      const created = await prisma.listing.create({
        data: { ownerId: user.id, ...listingData },
      })
      listingId = created.id
    }

    // 3. Persist co-roommate details
    if (d.coRoommates && d.coRoommates.length > 0) {
      // Delete existing co-roommates for this listing
      await prisma.coRoommate.deleteMany({ where: { listingId } })

      // Create new co-roommate entries
      await prisma.coRoommate.createMany({
        data: d.coRoommates.map((cr) => ({
          listingId,
          name: cr.name,
          age: cr.age,
          occupation: cr.occupation,
          bio: cr.bio,
          instagram: cr.instagram,
        })),
      })

      logger.info("co_roommates_saved", {
        userId: user.id,
        listingId,
        count: d.coRoommates.length,
      })
    }
  }

  logger.info("onboarding_completed", { userId: user.id, intent: d.housingIntent })
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

  // Validate file type and size
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large. Max 5MB." }
  }

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

  logger.info("avatar_uploaded", { userId: user.id, path })
  return { url: publicUrl }
}

// ─── Upload listing photos ────────────────────────────────────────────────────
export async function uploadListingPhotos(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const listing = await prisma.listing.findFirst({
    where: { ownerId: user.id, isActive: true },
  })
  if (!listing) return { error: "No active listing found" }

  const files = formData.getAll("photos") as File[]
  if (!files.length) return { error: "No files provided" }
  if (files.length > 15) return { error: "Max 15 photos allowed" }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  const urls: string[] = [...listing.photos] // Keep existing photos

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) continue
    if (file.size > 10 * 1024 * 1024) continue // Skip files > 10MB

    const ext = file.name.split(".").pop()
    const path = `${user.id}/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(path, file, { contentType: file.type })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(path)
      urls.push(publicUrl)
    }
  }

  // Update listing with new photo URLs
  await prisma.listing.update({
    where: { id: listing.id },
    data: { photos: urls },
  })

  logger.info("listing_photos_uploaded", {
    userId: user.id,
    listingId: listing.id,
    count: urls.length - listing.photos.length,
  })

  return { photos: urls }
}
