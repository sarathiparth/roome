"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "motion/react"
import { useRouter } from "next/navigation"
import {
  Camera, MapPin, Briefcase, GraduationCap,
  Moon, Wind, Flame, Coffee, Edit3, Settings, ChevronRight,
  Check, Star, Home, Users, Search, ArrowRight, Shield,
  Heart, X, Zap, Quote, Sparkles, PawPrint
} from "lucide-react"
import { NavigationBar } from "@/components/navigation-bar"

// ─── Mock data ─────────────────────────────────────────────────────────────────
const PROFILE = {
  name: "Aman Singh",
  age: 24,
  photo: null as string | null,
  occupation: "Designer",
  collegeOrCompany: "Swiggy",
  city: "Bangalore",
  area: "Koramangala",
  bio: "A calm sanctuary is what I bring to any shared space. I work from home three days a week, love quiet mornings, and believe a clean kitchen is a form of self-care.",
  instagram: "@amansingh",
  lifestyle: {
    sleep: "early",
    cleanliness: "spotless",
    smoking: "no",
    drinking: "sometimes",
    cleanliness_score: 5,
    social_score: 2,
    noise_score: 1,
    guest_score: 3,
  },
  intent: "join_room" as "join_room" | "have_room" | "team_up",
  budget: 22000,
  moveIn: "2weeks",
  vibeCompleted: true,
  matchScore: 87,
  tags: ["Early Sleeper", "Clean AF", "Non-Smoker", "WFH Life", "Gym Rat"],
}

const intentLabel: Record<string, string> = {
  join_room: "Looking to join a room",
  have_room: "Has a room — needs a roommate",
  team_up: "Let's find a place together",
}

const intentIcon: Record<string, React.ReactNode> = {
  join_room: <Search className="h-5 w-5" />,
  have_room: <Home className="h-5 w-5" />,
  team_up: <Users className="h-5 w-5" />,
}

const sleepLabel: Record<string, string> = { early: "Early Bird 🌅", night: "Night Owl 🦉", flexible: "Flexible" }
const cleanLabel: Record<string, string> = { spotless: "Spotless 🧹", tidy: "Tidy ✨", relaxed: "Relaxed 😌" }
const smokeLabel: Record<string, string> = { yes: "Smoker 🚬", outside: "Outside only", no: "Non-smoker ✅" }
const drinkLabel: Record<string, string> = { yes: "Social drinker 🥂", sometimes: "Occasionally 🍷", no: "Don't drink 🚫" }
const moveInLabel: Record<string, string> = { now: "Right Now", "2weeks": "In 2 Weeks", "1month": "In 1 Month", flexible: "Flexible" }

// ─── Animated meter bar ────────────────────────────────────────────────────────
function MeterBar({ label, value, max = 5, color }: { label: string; value: number; max?: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-xs font-medium">{label}</span>
        <span className="text-white/40 text-xs">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${(value / max) * 100}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        />
      </div>
    </div>
  )
}

// ─── Floating glow tag ─────────────────────────────────────────────────────────
function GlowTag({ label, index }: { label: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const glows = [
    "rgba(99,102,241,0.5)", "rgba(34,211,238,0.5)", "rgba(167,139,250,0.5)",
    "rgba(251,191,36,0.5)", "rgba(52,211,153,0.5)"
  ]
  const borders = [
    "rgba(99,102,241,0.35)", "rgba(34,211,238,0.35)", "rgba(167,139,250,0.35)",
    "rgba(251,191,36,0.35)", "rgba(52,211,153,0.35)"
  ]
  const glow = glows[index % glows.length]
  const border = borders[index % borders.length]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "backOut" }}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="relative cursor-default px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/85 select-none"
      style={{
        background: `rgba(255,255,255,0.04)`,
        border: `1px solid ${border}`,
        boxShadow: `0 0 12px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        backdropFilter: "blur(8px)",
      }}
    >
      {label}
    </motion.div>
  )
}

// ─── Animated section card ─────────────────────────────────────────────────────
function LiveCard({
  children,
  delay = 0,
  glowColor = "rgba(255,255,255,0.03)",
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  glowColor?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-30px" })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, rotateX: 4 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: hovered
          ? `0 0 30px ${glowColor}, 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)`
          : `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "box-shadow 0.4s ease, transform 0.4s ease",
        transform: hovered ? "scale(1.015) translateY(-2px)" : "scale(1) translateY(0)",
      }}
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ─── Circular progress ─────────────────────────────────────────────────────────
function CircularMatch({ score }: { score: number }) {
  const ref = useRef<SVGCircleElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true })
  const circumference = 2 * Math.PI * 36

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <motion.circle
          ref={ref}
          cx="40" cy="40" r="36"
          stroke="url(#matchGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: circumference - (score / 100) * circumference } : {}}
          transition={{ duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          fill="none"
        />
        <defs>
          <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <motion.div
          className="text-2xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}%
        </motion.div>
        <div className="text-[9px] text-white/40 font-medium tracking-wider uppercase">Match</div>
      </div>
    </div>
  )
}

// ─── Breathing pulse icon ──────────────────────────────────────────────────────
function BreathingIcon({ children, glowColor }: { children: React.ReactNode; glowColor: string }) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 8px ${glowColor}`,
          `0 0 20px ${glowColor}`,
          `0 0 8px ${glowColor}`,
        ],
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className="h-12 w-12 rounded-2xl border border-white/10 bg-white/[0.06] flex items-center justify-center text-white/80"
    >
      {children}
    </motion.div>
  )
}

// ─── Swipe action button ───────────────────────────────────────────────────────
function SwipeButton({
  icon,
  color,
  glow,
  label,
  onClick,
}: {
  icon: React.ReactNode
  color: string
  glow: string
  label: string
  onClick?: () => void
}) {
  const [flashing, setFlashing] = useState(false)
  const handleClick = () => {
    setFlashing(true)
    setTimeout(() => setFlashing(false), 500)
    onClick?.()
  }
  return (
    <motion.button
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="relative flex flex-col items-center gap-1.5"
    >
      <AnimatePresence>
        {flashing && (
          <motion.div
            key="flash"
            className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center border"
        style={{
          background: color,
          borderColor: glow,
          boxShadow: `0 0 16px ${glow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
        }}
      >
        {icon}
      </div>
      <span className="text-[10px] text-white/30 font-medium">{label}</span>
    </motion.button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [hasPet, setHasPet] = useState<boolean | null>(null)
  const [petDetails, setPetDetails] = useState("")

  const { scrollY } = useScroll({ container: scrollRef })

  // parallax
  const heroImageY = useTransform(scrollY, [0, 400], [0, 80])
  const heroOpacity = useTransform(scrollY, [0, 320], [1, 0.3])
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.08])

  const heroImageYSpring = useSpring(heroImageY, { stiffness: 80, damping: 20 })

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Dark phone column — max 430px, white page shows on sides on desktop */}
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">
        {/* Deep ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 10%, rgba(52,211,153,0.06) 0%, transparent 50%)",
          }}
        />

        <NavigationBar />

      {/* ── Scrollable container ── */}
      <div
        ref={scrollRef}
        className="relative h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* ╔══════════════════════════════════════════╗ */}
        {/* ║   HERO — CINEMATIC                       ║ */}
        {/* ╚══════════════════════════════════════════╝ */}
        <div ref={heroRef} className="relative h-[70vh] min-h-[480px] overflow-hidden">
          {/* Parallax background photo / avatar */}
          <motion.div
            style={{ y: heroImageYSpring, scale: heroScale }}
            className="absolute inset-0 w-full h-full origin-top"
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15) 0%, rgba(8,8,8,0.95) 70%)",
              }}
            >
              {/* Avatar placeholder — cinematic center circle */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 40px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.15)",
                    "0 0 70px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.3)",
                    "0 0 40px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.15)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-40 w-40 rounded-full bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center border border-white/[0.1]"
              >
                <Camera className="h-10 w-10 text-white/20" />
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform">
                  <Edit3 className="h-4 w-4 text-black" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, #080808 0%, rgba(8,8,8,0.85) 30%, rgba(8,8,8,0.3) 60%, transparent 100%)",
            }}
          />

          {/* Hero text */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 px-6 pb-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl font-black tracking-tight text-white leading-none"
            >
              {PROFILE.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-1.5 text-white/50 text-base font-medium flex items-center gap-2"
            >
              <span>{PROFILE.age}</span>
              <span className="text-white/20">•</span>
              <MapPin className="h-3.5 w-3.5 text-white/35" />
              <span>{PROFILE.city}</span>
            </motion.p>

            {/* Floating glow tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {PROFILE.tags.map((tag, i) => (
                <GlowTag key={tag} label={tag} index={i} />
              ))}
            </motion.div>
          </motion.div>

          {/* Settings button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-14 right-5 h-10 w-10 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-20"
          >
            <Settings className="h-4 w-4" />
          </motion.button>
        </div>

        {/* ╔══════════════════════════════════════════╗ */}
        {/* ║   CONTENT — CARDS                        ║ */}
        {/* ╚══════════════════════════════════════════╝ */}
        <div className="relative z-10 max-w-md mx-auto px-4 pb-36 -mt-4 space-y-4">

          {/* ── Swipe actions ── */}
          <LiveCard delay={0.05} glowColor="rgba(255,255,255,0.05)">
            <div className="px-6 py-5 flex items-center justify-between">
              <SwipeButton
                icon={<X className="h-6 w-6 text-red-400" />}
                color="rgba(239,68,68,0.12)"
                glow="rgba(239,68,68,0.4)"
                label="Pass"
              />
              <SwipeButton
                icon={<Zap className="h-6 w-6 text-amber-300" />}
                color="rgba(251,191,36,0.12)"
                glow="rgba(251,191,36,0.45)"
                label="Super"
              />
              <SwipeButton
                icon={<Heart className="h-6 w-6 text-emerald-400" />}
                color="rgba(52,211,153,0.12)"
                glow="rgba(52,211,153,0.4)"
                label="Connect"
              />
            </div>
          </LiveCard>

          {/* ── Match score + bio inline ── */}
          <LiveCard delay={0.1} glowColor="rgba(99,102,241,0.12)">
            <div className="px-5 py-5 flex items-center gap-5">
              <CircularMatch score={PROFILE.matchScore} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Compatibility</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                  {PROFILE.bio}
                </p>
              </div>
            </div>
          </LiveCard>

          {/* ── Prompt / quote card ── */}
          <LiveCard delay={0.15} glowColor="rgba(167,139,250,0.1)">
            <div className="px-6 py-6 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)" }}
              />
              <Quote className="h-6 w-6 text-violet-400/40 mb-3" />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-white/85 text-lg font-light italic leading-relaxed tracking-wide"
                style={{ fontStyle: "italic" }}
              >
                "A calm sanctuary is what I bring to any shared space."
              </motion.p>
              <p className="mt-3 text-white/30 text-xs font-medium">— Aman's intro prompt</p>
            </div>
          </LiveCard>

          {/* ── Intent card ── */}
          <LiveCard delay={0.18} glowColor="rgba(34,211,238,0.1)">
            <div className="px-2 py-1 border-b border-white/[0.05] flex items-center justify-between">
              <span className="px-3 py-2 text-xs uppercase tracking-widest font-semibold text-white/25">What I'm looking for</span>
              <button className="h-8 w-8 rounded-full flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all mr-1">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-4 mb-4">
                <BreathingIcon glowColor="rgba(34,211,238,0.35)">
                  {intentIcon[PROFILE.intent]}
                </BreathingIcon>
                <div>
                  <p className="text-white font-semibold text-sm">{intentLabel[PROFILE.intent]}</p>
                  <p className="text-white/40 text-xs mt-0.5">{moveInLabel[PROFILE.moveIn]}</p>
                </div>
              </div>
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-white/45 text-sm">Budget</span>
                <span
                  className="text-base font-bold"
                  style={{ background: "linear-gradient(90deg,#818cf8,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  ₹{PROFILE.budget.toLocaleString("en-IN")}/mo
                </span>
              </div>
            </div>
          </LiveCard>

          {/* ── Lifestyle meter card ── */}
          <LiveCard delay={0.22} glowColor="rgba(52,211,153,0.08)">
            <div className="px-4 py-2 border-b border-white/[0.05] flex items-center justify-between">
              <span className="px-1 py-2 text-xs uppercase tracking-widest font-semibold text-white/25">Lifestyle Meters</span>
              <button className="h-8 w-8 rounded-full flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <MeterBar
                label="Cleanliness"
                value={PROFILE.lifestyle.cleanliness_score}
                color="linear-gradient(90deg, #34d399, #059669)"
              />
              <MeterBar
                label="Social Energy"
                value={PROFILE.lifestyle.social_score}
                color="linear-gradient(90deg, #818cf8, #6366f1)"
              />
              <MeterBar
                label="Noise Level"
                value={PROFILE.lifestyle.noise_score}
                color="linear-gradient(90deg, #fb923c, #f97316)"
              />
              <MeterBar
                label="Guest Frequency"
                value={PROFILE.lifestyle.guest_score}
                color="linear-gradient(90deg, #e879f9, #a855f7)"
              />
            </div>
          </LiveCard>

          {/* ── Pet section ── */}
          <LiveCard delay={0.24} glowColor="rgba(251,191,36,0.10)">
            <div className="px-4 py-2 border-b border-white/[0.05] flex items-center justify-between">
              <span className="px-1 py-2 text-xs uppercase tracking-widest font-semibold text-white/25">Pets</span>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <PawPrint className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-white/70 text-sm font-medium">Do you have a pet?</p>
              </div>
              {/* Yes / No toggle */}
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <motion.button
                    key={String(val)}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setHasPet(hasPet === val ? null : val)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      background: hasPet === val
                        ? val ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.12)"
                        : "rgba(255,255,255,0.03)",
                      borderColor: hasPet === val
                        ? val ? "rgba(251,191,36,0.35)" : "rgba(239,68,68,0.3)"
                        : "rgba(255,255,255,0.08)",
                      color: hasPet === val
                        ? val ? "rgba(251,191,36,0.95)" : "rgba(239,68,68,0.9)"
                        : "rgba(255,255,255,0.35)",
                      boxShadow: hasPet === val
                        ? val ? "0 0 12px rgba(251,191,36,0.15)" : "0 0 12px rgba(239,68,68,0.12)"
                        : "none",
                    }}
                  >
                    {val ? "Yes 🐾" : "No"}
                  </motion.button>
                ))}
              </div>
              {/* Pet details field */}
              {hasPet === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden"
                >
                  <label className="text-white/40 text-[10px] uppercase font-black tracking-widest block mb-2">Tell us about your pet</label>
                  <input
                    type="text"
                    value={petDetails}
                    onChange={(e) => setPetDetails(e.target.value)}
                    placeholder="e.g. Golden retriever named Biscuit 🐶"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white/85 text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] transition-all"
                  />
                </motion.div>
              )}
            </div>
          </LiveCard>

          {/* ── Habits pill grid ── */}
          <LiveCard delay={0.26} glowColor="rgba(251,191,36,0.06)">
            <div className="px-4 py-2 border-b border-white/[0.05]">
              <span className="px-1 py-2 text-xs uppercase tracking-widest font-semibold text-white/25">Habits & Vibes</span>
            </div>
            <div className="px-5 py-5 grid grid-cols-2 gap-2.5">
              {[
                { icon: <Moon className="h-3.5 w-3.5" />, label: sleepLabel[PROFILE.lifestyle.sleep], glow: "rgba(167,139,250,0.3)" },
                { icon: <Wind className="h-3.5 w-3.5" />, label: cleanLabel[PROFILE.lifestyle.cleanliness], glow: "rgba(52,211,153,0.3)" },
                { icon: <Flame className="h-3.5 w-3.5" />, label: smokeLabel[PROFILE.lifestyle.smoking], glow: "rgba(239,68,68,0.3)" },
                { icon: <Coffee className="h-3.5 w-3.5" />, label: drinkLabel[PROFILE.lifestyle.drinking], glow: "rgba(251,191,36,0.3)" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  whileHover={{ scale: 1.04 }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: `0 0 0px ${item.glow}`,
                    transition: "box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${item.glow}`
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0px ${item.glow}`
                  }}
                >
                  <span className="text-white/35">{item.icon}</span>
                  <span className="text-white/70 text-xs font-medium leading-tight">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </LiveCard>

          {/* ── Match Insight card ── */}
          <LiveCard delay={0.3} glowColor="rgba(99,102,241,0.15)">
            <div className="px-5 py-5 relative overflow-hidden">
              {/* Corner glow */}
              <div
                className="absolute -top-6 -right-6 h-24 w-24 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
              />
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    boxShadow: "0 0 12px rgba(99,102,241,0.3)",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Match Insights</p>
                  <p className="text-white/35 text-xs">AI-powered compatibility</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: "✔", text: "Both prefer quiet evenings", color: "text-emerald-400" },
                  { icon: "✔", text: "Similar cleanliness standards", color: "text-emerald-400" },
                  { icon: "✔", text: "Aligned on pet-friendly homes", color: "text-emerald-400" },
                  { icon: "⚠", text: "Slight difference in guest frequency", color: "text-amber-400" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <span className={`${item.color} font-bold text-base w-4 shrink-0`}>{item.icon}</span>
                    <span className="text-white/60">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </LiveCard>

          {/* ── Vibe complete / banner ── */}
          {!PROFILE.vibeCompleted ? (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/vibe?mode=quick")}
              className="w-full flex items-center justify-between p-5 rounded-2xl"
              style={{
                background: "linear-gradient(135deg,#052e16 0%,#15803d 50%,#4ade80 100%)",
                boxShadow: "0 0 30px rgba(74,222,128,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                border: "1px solid rgba(74,222,128,0.3)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
                  <Star className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Complete your Vibe Test</p>
                  <p className="text-white/60 text-xs">Get seen by the right people · 5 min</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/70" />
            </motion.button>
          ) : (
            <LiveCard delay={0.34} glowColor="rgba(52,211,153,0.12)">
              <div className="px-5 py-4 flex items-center gap-4">
                <motion.div
                  animate={{ boxShadow: ["0 0 8px rgba(52,211,153,0.3)", "0 0 20px rgba(52,211,153,0.5)", "0 0 8px rgba(52,211,153,0.3)"] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"
                >
                  <Check className="h-5 w-5 text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-white font-semibold text-sm">Vibe Test Complete</p>
                  <p className="text-white/35 text-xs mt-0.5">Your profile is visible to others</p>
                </div>
              </div>
            </LiveCard>
          )}

          {/* ── Settings links ── */}
          <LiveCard delay={0.38}>
            <div className="divide-y divide-white/[0.05]">
              {[
                { icon: <Edit3 className="h-4 w-4" />, label: "Edit full profile", sub: "Update your details", action: () => router.push("/onboarding") },
                { icon: <Home className="h-4 w-4" />, label: "My room listing", sub: "Manage your space", action: () => router.push("/room-setup") },
                { icon: <Shield className="h-4 w-4" />, label: "Privacy & safety", sub: "Control visibility" },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  onClick={item.action}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 group-hover:text-white/70 group-hover:border-white/15 transition-all">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white/75 text-sm font-medium group-hover:text-white/90 transition-colors">{item.label}</p>
                      <p className="text-white/25 text-xs group-hover:text-white/40 transition-colors">{item.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              ))}
            </div>
          </LiveCard>

        </div>
        </div>
      </div>
    </main>
  )
}
