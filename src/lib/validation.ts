/**
 * Centralized Zod validation schemas for all server action payloads.
 *
 * Every inbound payload is validated at the server-action boundary so that
 * downstream code can trust the data shape and types.
 */

import { z } from "zod"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Run a Zod schema against raw data and return a discriminated result. */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }

  // Flatten errors into a human-readable string
  const messages = result.error.issues.map(
    (i) => `${i.path.join(".")}: ${i.message}`,
  )
  return { success: false, error: messages.join("; ") }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

const uuid = z.string().uuid()
const optionalString = z.string().optional()
const optionalInt = z.coerce.number().int().optional()
const optionalBool = z.boolean().optional()
const optionalDate = z.string().datetime({ offset: true }).or(z.string().date()).optional()

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100),
})

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const onboardingProfileSchema = z.object({
  // Basic info
  occupation: optionalString,
  college: optionalString,
  company: optionalString,
  city: optionalString,
  country: optionalString,
  instagram: optionalString,
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),

  // Move-in
  moveInDate: optionalDate,
  moveInFlexible: optionalBool,

  // Lifestyle
  sleepSchedule: z.enum(["early", "night", "flexible"]).optional(),
  cleanliness: z.enum(["spotless", "tidy", "relaxed"]).optional(),
  smoking: z.enum(["yes", "outside", "no"]).optional(),
  drinking: z.enum(["yes", "sometimes", "no"]).optional(),

  // Preferences
  roommatePref: z.enum(["same_exclusive", "same_prefer", "any"]).optional(),
  housingIntent: z.enum(["have_room", "join_room", "team_up"]).optional(),

  // Listing fields (only if have_room)
  propLocation: optionalString,
  propType: optionalString,
  propRoomType: optionalString,
  propFurnishing: optionalString,
  occCurrent: optionalInt,
  occTotal: optionalInt,
  occAvailable: optionalInt,
  rent: optionalInt,
  deposit: optionalInt,
  propMoveInDate: optionalDate,
  amenities: z.array(z.string()).optional(),

  // Co-roommates (only if have_room and occCurrent > 1)
  coRoommates: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        age: z.coerce.number().int().min(16).max(99).optional(),
        occupation: optionalString,
        bio: z.string().max(300).optional(),
        instagram: optionalString,
      }),
    )
    .optional(),
})

export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>

// ─── Profile Update ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  instagram: z.string().max(100).optional(),
  budget: z.coerce.number().int().min(0).max(999999).optional(),
  hasPet: optionalBool,
  petDescription: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ─── Swipes ───────────────────────────────────────────────────────────────────

export const recordSwipeSchema = z.object({
  swipedId: uuid,
  direction: z.enum(["like", "pass", "super"]),
})

export type RecordSwipeInput = z.infer<typeof recordSwipeSchema>

// ─── Messages ─────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  matchId: uuid,
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long"),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const markReadSchema = z.object({
  matchId: uuid,
})
