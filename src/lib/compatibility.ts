/**
 * Roomi Compatibility Engine — TypeScript Port
 *
 * A high-performance TypeScript port of the Python compatibility_model.py.
 * This runs in-process (Next.js server or Edge Function) for <100ms scoring.
 *
 * Architecture:
 *   - build_feature_vector(): Computes 60+ features from two user profiles
 *   - rule_based_score(): Weighted penalty/bonus calculation
 *   - hard_filter(): Dealbreaker detection (diet, lifestyle, guest policy)
 *   - computeCompatibility(): Orchestrates the full pipeline
 */

// ─── Schema Constants ─────────────────────────────────────────────────────────

export const SLEEP_QUESTIONS = [
  "sleep_noise", "sleep_consistency", "sleep_timing",
  "wake_timing", "sleep_mood", "sleep_tolerance",
] as const

export const CLEAN_QUESTIONS = [
  "clean_standard", "clean_mess", "clean_shared",
  "clean_organized", "clean_reaction", "clean_sensitivity", "clean_boundaries",
] as const

export const FINANCE_QUESTIONS = [
  "finance_discipline", "finance_tracking", "finance_unequal",
  "finance_budget", "finance_fairness", "finance_unplanned",
] as const

export const SOCIAL_QUESTIONS = [
  "social_level", "social_guests", "social_notice",
  "social_overnight", "social_recharge", "social_gender", "social_family",
] as const

export const CONFLICT_QUESTIONS = [
  "conflict_direct", "conflict_feedback", "conflict_persistent",
  "conflict_resolution", "conflict_privacy",
] as const

export const CULTURE_QUESTIONS = [
  "culture_diversity", "culture_food", "culture_family", "culture_alcohol",
] as const

export const SECTIONS = {
  sleep: SLEEP_QUESTIONS,
  clean: CLEAN_QUESTIONS,
  finance: FINANCE_QUESTIONS,
  social: SOCIAL_QUESTIONS,
  conflict: CONFLICT_QUESTIONS,
  culture: CULTURE_QUESTIONS,
} as const

export type SectionName = keyof typeof SECTIONS

export const ALL_QUESTION_KEYS = Object.values(SECTIONS).flat()

// ─── Types ────────────────────────────────────────────────────────────────────

/** Raw vibe check responses — each question is scored 1-5. */
export interface VibeResponses {
  [key: string]: number
}

/** User profile data needed for compatibility scoring. */
export interface UserProfile {
  id: string
  sleepSchedule?: string | null
  cleanliness?: string | null
  smoking?: string | null
  drinking?: string | null
  housingIntent?: string | null
  budget?: number | null
  hasPet?: boolean | null
  moveInDate?: Date | string | null
  moveInFlexible?: boolean | null
  tags?: string[]
  vibeResponses?: VibeResponses | null
}

/** Section-level compatibility breakdown. */
export interface SectionScores {
  sleep: number
  clean: number
  finance: number
  social: number
  conflict: number
  culture: number
}

/** Full compatibility result. */
export interface CompatibilityResult {
  compatible: boolean
  rejectionReason: string | null
  ruleScore: number
  finalScore: number
  compatibilityPct: number
  sectionScores: SectionScores
  sectionDiffs: SectionScores
}

// ─── Feature Vector Builder ───────────────────────────────────────────────────

function sectionDiff(
  a: VibeResponses,
  b: VibeResponses,
  questions: readonly string[],
): number {
  let sum = 0
  for (const q of questions) {
    sum += Math.abs((a[q] ?? 3) - (b[q] ?? 3)) / 4.0
  }
  return sum / questions.length
}

function sectionStd(
  a: VibeResponses,
  b: VibeResponses,
  questions: readonly string[],
): number {
  const diffs = questions.map((q) => Math.abs((a[q] ?? 3) - (b[q] ?? 3)) / 4.0)
  const mean = diffs.reduce((s, d) => s + d, 0) / diffs.length
  const variance = diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / diffs.length
  return Math.sqrt(variance)
}

interface FeatureVector {
  [key: string]: number
}

function buildFeatureVector(
  a: VibeResponses,
  b: VibeResponses,
  profileA: UserProfile,
  profileB: UserProfile,
): FeatureVector {
  const fv: FeatureVector = {}

  // Individual trait granular differences
  for (const q of ALL_QUESTION_KEYS) {
    fv[`${q}_diff`] = Math.abs((a[q] ?? 3) - (b[q] ?? 3)) / 4.0
  }

  // Section diffs (raw + importance-weighted)
  for (const [section, questions] of Object.entries(SECTIONS)) {
    const raw = sectionDiff(a, b, questions)
    const std = sectionStd(a, b, questions)
    const impA = a[`imp_${section}`] ?? 3
    const impB = b[`imp_${section}`] ?? 3
    const avgImp = (impA + impB) / 2.0
    const weight = avgImp / 5.0

    fv[`${section}_diff`] = raw
    fv[`${section}_weighted_diff`] = raw * weight
    fv[`${section}_std`] = std
    fv[`imp_align_${section}`] = Math.abs(impA - impB) / 4.0
    fv[`imp_max_${section}`] = Math.max(impA, impB) / 5.0
    fv[`imp_min_${section}`] = Math.min(impA, impB) / 5.0
  }

  // Cross-section interaction features
  fv["sleep_x_clean"] = fv["sleep_weighted_diff"] * fv["clean_weighted_diff"]
  fv["finance_x_social"] = fv["finance_weighted_diff"] * fv["social_weighted_diff"]

  // Max section diff — captures worst single pain-point
  fv["max_section_diff"] = Math.max(
    ...Object.keys(SECTIONS).map((s) => fv[`${s}_diff`]),
  )

  // Weighted composite score (rule-based signal as feature)
  fv["rb_penalty"] =
    fv["sleep_diff"] * 0.3 +
    fv["clean_diff"] * 0.25 +
    fv["finance_diff"] * 0.15 +
    fv["social_diff"] * 0.12 +
    fv["conflict_diff"] * 0.1 +
    fv["culture_diff"] * 0.08

  // Importance overlap: both rate same section as high-priority but differ
  fv["high_imp_conflict"] = Object.keys(SECTIONS).reduce((count, s) => {
    if (
      (a[`imp_${s}`] ?? 3) >= 4 &&
      (b[`imp_${s}`] ?? 3) >= 4 &&
      fv[`${s}_diff`] > 0.5
    ) {
      return count + 1
    }
    return count
  }, 0)

  // ── Profile-level features ──────────────────────────────────────────────

  // Budget gap
  const budgetA = profileA.budget ?? 15000
  const budgetB = profileB.budget ?? 15000
  fv["budget_gap"] = Math.abs(budgetA - budgetB) / 45000.0

  // Lifestyle match from profile fields
  fv["sleep_schedule_match"] =
    profileA.sleepSchedule && profileB.sleepSchedule
      ? profileA.sleepSchedule === profileB.sleepSchedule
        ? 1.0
        : 0.0
      : 0.5

  fv["cleanliness_match"] =
    profileA.cleanliness && profileB.cleanliness
      ? profileA.cleanliness === profileB.cleanliness
        ? 1.0
        : 0.0
      : 0.5

  fv["smoking_match"] =
    profileA.smoking && profileB.smoking
      ? profileA.smoking === profileB.smoking
        ? 1.0
        : 0.0
      : 0.5

  fv["drinking_match"] =
    profileA.drinking && profileB.drinking
      ? profileA.drinking === profileB.drinking
        ? 1.0
        : 0.0
      : 0.5

  // Housing intent compatibility
  fv["intent_match"] = computeIntentMatch(
    profileA.housingIntent,
    profileB.housingIntent,
  )

  // Lifestyle extreme check (early bird × night owl)
  fv["lifestyle_extreme"] =
    (profileA.sleepSchedule === "early" && profileB.sleepSchedule === "night") ||
    (profileA.sleepSchedule === "night" && profileB.sleepSchedule === "early")
      ? 1.0
      : 0.0

  // Smoking conflict (non-smoker + smoker)
  fv["smoking_conflict"] =
    (profileA.smoking === "no" && profileB.smoking === "yes") ||
    (profileA.smoking === "yes" && profileB.smoking === "no")
      ? 1.0
      : 0.0

  // Shared tags
  const tagsA = new Set(profileA.tags ?? [])
  const tagsB = new Set(profileB.tags ?? [])
  const sharedTags = [...tagsA].filter((t) => tagsB.has(t)).length
  fv["shared_tags"] = Math.min(sharedTags / 5.0, 1.0) // Normalize 0-1

  return fv
}

// ─── Intent Matching ──────────────────────────────────────────────────────────

function computeIntentMatch(
  intentA?: string | null,
  intentB?: string | null,
): number {
  if (!intentA || !intentB) return 0.5

  // Perfect complements
  if (intentA === "have_room" && intentB === "join_room") return 1.0
  if (intentA === "join_room" && intentB === "have_room") return 1.0

  // Both team up
  if (intentA === "team_up" && intentB === "team_up") return 0.9

  // Partial match
  if (intentA === "team_up" || intentB === "team_up") return 0.6

  // Both have rooms (less useful)
  if (intentA === "have_room" && intentB === "have_room") return 0.3

  // Both looking to join (less useful)
  if (intentA === "join_room" && intentB === "join_room") return 0.4

  return 0.5
}

// ─── Hard Filters ─────────────────────────────────────────────────────────────

export function hardFilter(
  profileA: UserProfile,
  profileB: UserProfile,
): { passes: boolean; reason: string | null } {
  // Extreme lifestyle mismatch
  if (
    (profileA.sleepSchedule === "early" && profileB.sleepSchedule === "night") ||
    (profileA.sleepSchedule === "night" && profileB.sleepSchedule === "early")
  ) {
    // Don't hard-block, but flag — this is handled as a heavy penalty in scoring
  }

  // Non-smoker + indoor smoker is a dealbreaker
  if (
    (profileA.smoking === "no" && profileB.smoking === "yes") ||
    (profileA.smoking === "yes" && profileB.smoking === "no")
  ) {
    return { passes: false, reason: "Smoking incompatibility" }
  }

  return { passes: true, reason: null }
}

// ─── Rule-Based Score ─────────────────────────────────────────────────────────

function ruleBasedScore(fv: FeatureVector): number {
  // Penalty from section diffs
  const penalty =
    fv["sleep_diff"] * 0.30 +
    fv["clean_diff"] * 0.25 +
    fv["finance_diff"] * 0.15 +
    fv["social_diff"] * 0.12 +
    fv["conflict_diff"] * 0.10 +
    fv["culture_diff"] * 0.08

  // Bonus from matches
  const bonus =
    (fv["sleep_schedule_match"] ?? 0) * 0.06 +
    (fv["cleanliness_match"] ?? 0) * 0.05 +
    (fv["smoking_match"] ?? 0) * 0.04 +
    (fv["drinking_match"] ?? 0) * 0.03 +
    (fv["intent_match"] ?? 0) * 0.06 +
    (fv["shared_tags"] ?? 0) * 0.04

  // Hard penalties
  const hardPenalty =
    (fv["lifestyle_extreme"] ?? 0) * 0.15 +
    (fv["smoking_conflict"] ?? 0) * 0.20 +
    (fv["budget_gap"] ?? 0) * 0.10 +
    (fv["sleep_x_clean"] ?? 0) * 0.08 +
    (fv["max_section_diff"] ?? 0) * 0.05

  return Math.max(0, Math.min(1, 1.0 - penalty + bonus - hardPenalty))
}

// ─── Section-Level Scores (for "Why We Match" UI) ─────────────────────────────

function computeSectionScores(fv: FeatureVector): SectionScores {
  return {
    sleep: Math.round(Math.max(0, Math.min(100, (1 - fv["sleep_diff"]) * 100))),
    clean: Math.round(Math.max(0, Math.min(100, (1 - fv["clean_diff"]) * 100))),
    finance: Math.round(Math.max(0, Math.min(100, (1 - fv["finance_diff"]) * 100))),
    social: Math.round(Math.max(0, Math.min(100, (1 - fv["social_diff"]) * 100))),
    conflict: Math.round(Math.max(0, Math.min(100, (1 - fv["conflict_diff"]) * 100))),
    culture: Math.round(Math.max(0, Math.min(100, (1 - fv["culture_diff"]) * 100))),
  }
}

function computeSectionDiffs(fv: FeatureVector): SectionScores {
  return {
    sleep: Math.round(fv["sleep_diff"] * 1000) / 1000,
    clean: Math.round(fv["clean_diff"] * 1000) / 1000,
    finance: Math.round(fv["finance_diff"] * 1000) / 1000,
    social: Math.round(fv["social_diff"] * 1000) / 1000,
    conflict: Math.round(fv["conflict_diff"] * 1000) / 1000,
    culture: Math.round(fv["culture_diff"] * 1000) / 1000,
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Compute compatibility between two users.
 *
 * @param profileA - First user's profile
 * @param profileB - Second user's profile
 * @param vibeA - First user's vibe check responses (question_key → 1-5 score)
 * @param vibeB - Second user's vibe check responses
 * @returns Full compatibility result with score, breakdown, and section-level details
 */
export function computeCompatibility(
  profileA: UserProfile,
  profileB: UserProfile,
  vibeA?: VibeResponses | null,
  vibeB?: VibeResponses | null,
): CompatibilityResult {
  // Hard filter first
  const { passes, reason } = hardFilter(profileA, profileB)
  if (!passes) {
    return {
      compatible: false,
      rejectionReason: reason,
      ruleScore: 0,
      finalScore: 0,
      compatibilityPct: 0,
      sectionScores: { sleep: 0, clean: 0, finance: 0, social: 0, conflict: 0, culture: 0 },
      sectionDiffs: { sleep: 1, clean: 1, finance: 1, social: 1, conflict: 1, culture: 1 },
    }
  }

  // Generate default vibe responses from profile fields if not provided
  const effectiveVibeA = vibeA ?? generateDefaultVibe(profileA)
  const effectiveVibeB = vibeB ?? generateDefaultVibe(profileB)

  // Build feature vector
  const fv = buildFeatureVector(effectiveVibeA, effectiveVibeB, profileA, profileB)

  // Compute scores
  const ruleScore = ruleBasedScore(fv)
  const sectionScores = computeSectionScores(fv)
  const sectionDiffs = computeSectionDiffs(fv)

  // Final score = rule-based score (ML weight reserved for deep scorer)
  const finalScore = ruleScore
  const compatibilityPct = Math.round(finalScore * 100)

  return {
    compatible: compatibilityPct >= 50,
    rejectionReason: null,
    ruleScore: Math.round(ruleScore * 10000) / 10000,
    finalScore: Math.round(finalScore * 10000) / 10000,
    compatibilityPct,
    sectionScores,
    sectionDiffs,
  }
}

// ─── Default Vibe Generator ───────────────────────────────────────────────────
// When users haven't completed the vibe check, generate approximate responses
// from their profile fields.

function generateDefaultVibe(profile: UserProfile): VibeResponses {
  const vibe: VibeResponses = {}

  // Default all questions to neutral (3)
  for (const q of ALL_QUESTION_KEYS) {
    vibe[q] = 3
  }

  // Default importance to medium
  for (const s of Object.keys(SECTIONS)) {
    vibe[`imp_${s}`] = 3
  }

  // Adjust based on profile fields
  if (profile.sleepSchedule === "early") {
    vibe["sleep_timing"] = 1
    vibe["wake_timing"] = 1
    vibe["sleep_consistency"] = 4
  } else if (profile.sleepSchedule === "night") {
    vibe["sleep_timing"] = 5
    vibe["wake_timing"] = 5
    vibe["sleep_consistency"] = 3
  }

  if (profile.cleanliness === "spotless") {
    vibe["clean_standard"] = 5
    vibe["clean_mess"] = 5
    vibe["clean_shared"] = 5
    vibe["clean_sensitivity"] = 5
    vibe["imp_clean"] = 5
  } else if (profile.cleanliness === "tidy") {
    vibe["clean_standard"] = 4
    vibe["clean_mess"] = 3
    vibe["clean_shared"] = 4
  } else if (profile.cleanliness === "relaxed") {
    vibe["clean_standard"] = 2
    vibe["clean_mess"] = 2
    vibe["clean_shared"] = 2
  }

  if (profile.smoking === "no") {
    vibe["imp_culture"] = 4
  }

  if (profile.drinking === "no") {
    vibe["culture_alcohol"] = 1
  } else if (profile.drinking === "yes") {
    vibe["culture_alcohol"] = 4
  }

  return vibe
}

// ─── Batch Scoring ────────────────────────────────────────────────────────────

/**
 * Score multiple candidates against a single user.
 * Returns candidates sorted by compatibility score (descending).
 */
export function batchScore(
  currentUser: UserProfile,
  currentVibe: VibeResponses | null,
  candidates: Array<{ profile: UserProfile; vibe?: VibeResponses | null }>,
): Array<{
  profile: UserProfile
  compatibility: CompatibilityResult
}> {
  const results = candidates.map(({ profile, vibe }) => ({
    profile,
    compatibility: computeCompatibility(currentUser, profile, currentVibe, vibe),
  }))

  // Sort descending by compatibility score
  results.sort((a, b) => b.compatibility.compatibilityPct - a.compatibility.compatibilityPct)

  return results
}
