"use client"

import React, { useState, useCallback, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowLeft, Check, Zap, Target } from "lucide-react"
import { InteractiveProductCard } from "@/components/ui/card-7"
import { LiquidMetalOptionBorder } from "@/components/ui/liquid-metal-option-border"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Waves } from "@/components/ui/wave-background"

// ─── Types ────────────────────────────────────────────────────────────────────

type SliderQ = {
  type: "slider"; id: string; text: string; emoji?: string
  lowLabel: string; highLabel: string
}
type BudgetQ = {
  type: "budget"; id: string; text: string; emoji?: string
  min: number; max: number; step: number
}
type MCQQ = {
  type: "mcq"; id: string; text: string; emoji?: string
  options: { label: string; value: number; emoji?: string }[]
}
type ImportanceScreen = {
  type: "importance"; sectionId: string; sectionTitle: string; sectionEmoji: string
}

type TimeSliderQ = {
  type: "time-slider"; id: string; text: string; emoji?: string
  minHour: number; maxHour: number; step: number
}

type VibeQuestion = SliderQ | BudgetQ | MCQQ | TimeSliderQ
type ScreenItem = VibeQuestion | ImportanceScreen

type Section = {
  id: string; title: string; emoji: string; gradient: string
  questions: VibeQuestion[]
}

type Mode = "quick" | "accurate"
type Phase = "mode" | "questions" | "boost" | "done"

// ─── QUICK MODE: 10 questions ─────────────────────────────────────────────────

const QUICK_QUESTIONS: VibeQuestion[] = [
  { type: "time-slider", id: "q_sleep_timing", emoji: "🌙", text: "What's your preferred bedtime?", minHour: 20, maxHour: 28, step: 1 },
  { type: "slider", id: "q_sleep_noise", emoji: "🔇", text: "How sensitive are you to noise while sleeping?", lowLabel: "Not sensitive", highLabel: "Very sensitive" },
  { type: "slider", id: "q_clean_standard", emoji: "🧹", text: "How clean do you expect your living space to be?", lowLabel: "Relaxed", highLabel: "Very strict" },
  {
    type: "mcq", id: "q_clean_mess", emoji: "🍳", text: "You see a messy kitchen that isn't yours. What do you do?",
    options: [
      { label: "Clean it myself", value: 1, emoji: "✨" },
      { label: "Clean and mention it", value: 2, emoji: "💬" },
      { label: "Wait for others", value: 3, emoji: "⏳" },
      { label: "Ignore it", value: 4, emoji: "🤷" },
    ],
  },
  { type: "slider", id: "q_social_level", emoji: "🏡", text: "How social are you at home?", lowLabel: "Very private", highLabel: "Very social" },
  { type: "slider", id: "q_social_guests", emoji: "🚪", text: "How comfortable are you with guests at home?", lowLabel: "Not comfortable", highLabel: "Very comfortable" },
  {
    type: "mcq", id: "q_finance_expense", emoji: "💸", text: "How do you prefer managing shared expenses?",
    options: [
      { label: "Track everything exactly", value: 1, emoji: "📊" },
      { label: "Rough tracking", value: 2, emoji: "📝" },
      { label: "Split loosely", value: 3, emoji: "🤝" },
      { label: "No strict system", value: 4, emoji: "😌" },
    ],
  },
  { type: "budget", id: "q_budget", emoji: "💰", text: "What's your monthly rent budget?", min: 5000, max: 50000, step: 1000 },
  {
    type: "mcq", id: "q_conflict_style", emoji: "🗣️", text: "When something bothers you at home, what do you usually do?",
    options: [
      { label: "Address it immediately", value: 1, emoji: "🎯" },
      { label: "Wait and then discuss", value: 2, emoji: "⏳" },
      { label: "Drop hints indirectly", value: 3, emoji: "🌀" },
      { label: "Stay silent", value: 4, emoji: "🤐" },
    ],
  },
  {
    type: "mcq", id: "q_lifestyle_strict", emoji: "🪔", text: "How strict are your lifestyle preferences (food, habits, routine)?",
    options: [
      { label: "Very flexible", value: 1, emoji: "🌊" },
      { label: "Some preferences", value: 2, emoji: "🌿" },
      { label: "Prefer similar people", value: 3, emoji: "🎯" },
      { label: "Very strict", value: 4, emoji: "🔒" },
    ],
  },
]

const BOOST_OPTIONS = [
  { id: "sleep", label: "Sleep", emoji: "🌙", desc: "Schedule & noise" },
  { id: "cleanliness", label: "Cleanliness", emoji: "🧹", desc: "Standards & mess" },
  { id: "guests", label: "Guests", emoji: "🚪", desc: "Visitors & social" },
  { id: "money", label: "Money", emoji: "💸", desc: "Expenses & budget" },
]

// ─── ACCURATE MODE: 36 questions across 6 sections ───────────────────────────

const ACCURATE_SECTIONS: Section[] = [
  {
    id: "sleep", title: "Sleep & Schedule", emoji: "🌙", gradient: "from-indigo-900/30 via-black to-black",
    questions: [
      { type: "time-slider", id: "a_sleep_timing", emoji: "🛏️", text: "Sleep timing preference", minHour: 20, maxHour: 28, step: 1 },
      { type: "slider", id: "a_sleep_noise", emoji: "🔇", text: "Noise sensitivity while sleeping", lowLabel: "Not sensitive", highLabel: "Very sensitive" },
      {
        type: "mcq", id: "a_sleep_disturbed", emoji: "😤", text: "If your sleep is disturbed, what do you do?",
        options: [
          { label: "Ignore it", value: 1, emoji: "😴" }, { label: "Adjust quietly", value: 2, emoji: "🤫" },
          { label: "Ask politely", value: 3, emoji: "🙏" }, { label: "Confront directly", value: 4, emoji: "😤" },
        ],
      },
      { type: "slider", id: "a_sleep_routine", emoji: "📅", text: "Routine consistency", lowLabel: "Very flexible", highLabel: "Very fixed" },
      {
        type: "mcq", id: "a_sleep_disrupted", emoji: "🔀", text: "If your schedule is disrupted for a few days, you:",
        options: [
          { label: "Adjust quickly", value: 1, emoji: "🌊" }, { label: "Take time to recover", value: 2, emoji: "⏳" },
          { label: "Become inconsistent", value: 3, emoji: "🎲" }, { label: "Stop caring", value: 4, emoji: "🤷" },
        ],
      },
      { type: "slider", id: "a_sleep_diff", emoji: "🌓", text: "Comfort with someone on a very different schedule", lowLabel: "Comfortable", highLabel: "Not comfortable" },
    ],
  },
  {
    id: "clean", title: "Cleanliness & Space", emoji: "🧹", gradient: "from-emerald-900/30 via-black to-black",
    questions: [
      { type: "slider", id: "a_clean_standard", emoji: "✨", text: "Your cleanliness standard", lowLabel: "Relaxed", highLabel: "Very strict" },
      { type: "slider", id: "a_clean_mess_tol", emoji: "🗑️", text: "Mess tolerance level", lowLabel: "High tolerance", highLabel: "Zero tolerance" },
      {
        type: "mcq", id: "a_clean_kitchen", emoji: "🍳", text: "Messy kitchen situation — your reaction",
        options: [
          { label: "Clean it", value: 1, emoji: "🧽" }, { label: "Clean + mention", value: 2, emoji: "💬" },
          { label: "Wait", value: 3, emoji: "⏳" }, { label: "Ignore", value: 4, emoji: "🤷" },
        ],
      },
      { type: "slider", id: "a_clean_org", emoji: "📦", text: "Organization expectation in shared spaces", lowLabel: "Flexible", highLabel: "Very structured" },
      {
        type: "mcq", id: "a_clean_others", emoji: "😣", text: "If others don't clean properly, you:",
        options: [
          { label: "Address immediately", value: 1, emoji: "🎯" }, { label: "Mention later", value: 2, emoji: "💬" },
          { label: "Adjust silently", value: 3, emoji: "😶" }, { label: "Ignore", value: 4, emoji: "🤷" },
        ],
      },
      { type: "slider", id: "a_clean_sensitivity", emoji: "👃", text: "Sensitivity to clutter / smell", lowLabel: "Not sensitive", highLabel: "Very sensitive" },
      {
        type: "mcq", id: "a_clean_belongings", emoji: "🔐", text: "Someone uses your belongings without asking",
        options: [
          { label: "Fine by me", value: 1, emoji: "😄" }, { label: "Prefer asking first", value: 2, emoji: "🤲" },
          { label: "Irritated", value: 3, emoji: "😤" }, { label: "Not acceptable", value: 4, emoji: "🚫" },
        ],
      },
    ],
  },
  {
    id: "finance", title: "Finance & Expenses", emoji: "💸", gradient: "from-amber-900/30 via-black to-black",
    questions: [
      { type: "slider", id: "a_fin_discipline", emoji: "💰", text: "Financial discipline importance", lowLabel: "Not a big deal", highLabel: "Non-negotiable" },
      {
        type: "mcq", id: "a_fin_tracking", emoji: "🧾", text: "Expense tracking preference",
        options: [
          { label: "Exact tracking", value: 1, emoji: "📊" }, { label: "Rough tracking", value: 2, emoji: "📝" },
          { label: "Split loosely", value: 3, emoji: "🤝" }, { label: "No system", value: 4, emoji: "😌" },
        ],
      },
      { type: "slider", id: "a_fin_budget_strict", emoji: "📋", text: "Budget strictness", lowLabel: "Very flexible", highLabel: "Very strict" },
      { type: "budget", id: "a_fin_budget", emoji: "🏠", text: "Monthly rent budget", min: 5000, max: 50000, step: 1000 },
      {
        type: "mcq", id: "a_fin_delays", emoji: "📅", text: "If someone delays payments, you:",
        options: [
          { label: "Ignore", value: 1, emoji: "😌" }, { label: "Remind politely", value: 2, emoji: "💬" },
          { label: "Address directly", value: 3, emoji: "🎯" }, { label: "Treat as serious issue", value: 4, emoji: "🚨" },
        ],
      },
      { type: "slider", id: "a_fin_tolerance", emoji: "🤝", text: "Tolerance for different spending habits", lowLabel: "Very tolerant", highLabel: "Not tolerant" },
    ],
  },
  {
    id: "social", title: "Social & Guests", emoji: "🏠", gradient: "from-blue-900/30 via-black to-black",
    questions: [
      { type: "slider", id: "a_soc_level", emoji: "🏡", text: "Social level at home", lowLabel: "Very private", highLabel: "Very social" },
      { type: "slider", id: "a_soc_guests", emoji: "🚪", text: "Guest comfort level", lowLabel: "Not comfortable", highLabel: "Very comfortable" },
      {
        type: "mcq", id: "a_soc_unexpected", emoji: "😳", text: "If guests arrive unexpectedly, you:",
        options: [
          { label: "Join in!", value: 1, emoji: "🎉" }, { label: "Ignore them", value: 2, emoji: "🙈" },
          { label: "Slightly annoyed", value: 3, emoji: "😐" }, { label: "Very frustrated", value: 4, emoji: "😤" },
        ],
      },
      { type: "slider", id: "a_soc_notice", emoji: "📢", text: "Notice needed before guests arrive", lowLabel: "No notice", highLabel: "Long notice" },
      { type: "slider", id: "a_soc_overnight", emoji: "🛏️", text: "Comfort with overnight guests", lowLabel: "Not comfortable", highLabel: "Very comfortable" },
      {
        type: "mcq", id: "a_soc_afterday", emoji: "💤", text: "After a long day, you prefer:",
        options: [
          { label: "Alone time", value: 1, emoji: "🧘" }, { label: "Quiet company", value: 2, emoji: "📖" },
          { label: "Either is fine", value: 3, emoji: "⚖️" }, { label: "Social time!", value: 4, emoji: "🎉" },
        ],
      },
      { type: "slider", id: "a_soc_longstay", emoji: "👨‍👩‍👧", text: "Comfort with long-staying visitors", lowLabel: "Not comfortable", highLabel: "Very comfortable" },
    ],
  },
  {
    id: "conflict", title: "Conflict & Communication", emoji: "🗣️", gradient: "from-rose-900/30 via-black to-black",
    questions: [
      { type: "slider", id: "a_conf_direct", emoji: "🎯", text: "How directly do you address problems?", lowLabel: "Avoid conflict", highLabel: "Very direct" },
      {
        type: "mcq", id: "a_conf_bother", emoji: "💬", text: "When something bothers you, you:",
        options: [
          { label: "Address immediately", value: 1, emoji: "🎯" }, { label: "Wait and discuss", value: 2, emoji: "⏳" },
          { label: "Hint indirectly", value: 3, emoji: "🌀" }, { label: "Stay silent", value: 4, emoji: "🤐" },
        ],
      },
      { type: "slider", id: "a_conf_feedback", emoji: "🪞", text: "Reaction to feedback or criticism", lowLabel: "Very open", highLabel: "Defensive" },
      {
        type: "mcq", id: "a_conf_continues", emoji: "🔄", text: "If conflict continues, you:",
        options: [
          { label: "Confront strongly", value: 1, emoji: "💥" }, { label: "Try different approach", value: 2, emoji: "🔄" },
          { label: "Accept it", value: 3, emoji: "😌" }, { label: "Withdraw", value: 4, emoji: "🚶" },
        ],
      },
      { type: "slider", id: "a_conf_resolution", emoji: "🕊️", text: "Importance of resolving conflicts clearly", lowLabel: "Not important", highLabel: "Very important" },
    ],
  },
  {
    id: "culture", title: "Culture & Lifestyle", emoji: "🪔", gradient: "from-purple-900/30 via-black to-black",
    questions: [
      { type: "slider", id: "a_cult_diversity", emoji: "🌍", text: "Comfort with different cultural practices", lowLabel: "Need same culture", highLabel: "Fully embrace" },
      { type: "slider", id: "a_cult_food", emoji: "🍽️", text: "Food preference strictness in shared space", lowLabel: "Very flexible", highLabel: "Very strict" },
      { type: "slider", id: "a_cult_family", emoji: "👪", text: "Frequency of hosting family / relatives at home", lowLabel: "Never", highLabel: "Very frequent" },
      {
        type: "mcq", id: "a_cult_lifestage", emoji: "🌱", text: "What's your current life stage?",
        options: [
          { label: "Student", value: 1, emoji: "🎓" }, { label: "Early career", value: 2, emoji: "💼" },
          { label: "Mid career", value: 3, emoji: "📈" }, { label: "Flexible / Self-employed", value: 4, emoji: "💻" },
        ],
      },
      { type: "slider", id: "a_cult_alcohol", emoji: "🍾", text: "Comfort with alcohol in the house", lowLabel: "Fully okay", highLabel: "Not okay" },
    ],
  },
]

function buildAccurateScreens(): ScreenItem[] {
  const screens: ScreenItem[] = []
  for (const sec of ACCURATE_SECTIONS) {
    for (const q of sec.questions) screens.push(q)
    screens.push({ type: "importance", sectionId: sec.id, sectionTitle: sec.title, sectionEmoji: sec.emoji })
  }
  return screens
}

const ACCURATE_SCREENS = buildAccurateScreens()

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Tight slider — value tap-buttons + track, no excessive gap */
function SliderInput({ question, value, onChange }: {
  question: SliderQ; value: number; onChange: (v: number) => void
}) {
  const pct = ((value - 1) / 4) * 100
  return (
    <div className="w-full space-y-5">
      {/* Value badge */}
      <div className="flex items-end justify-center gap-2">
        <motion.span
          key={value}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-black text-white tabular-nums leading-none"
        >
          {value}
        </motion.span>
        <span className="text-white/30 text-lg mb-1.5">/ 5</span>
      </div>

      {/* Tap buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((tick) => (
          <div key={tick} className={cn("flex-1 transition-transform duration-200", value === tick && "scale-105")}>
            <LiquidMetalOptionBorder active={value === tick} borderRadius={12} borderWidth={1.5}>
              <button
                onClick={() => onChange(tick)}
                className={cn(
                  "w-full h-12 flex items-center justify-center rounded-[10.5px] text-base font-bold transition-colors backdrop-blur-[32px]",
                  value === tick
                    ? "bg-black/80 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                    : "bg-black/60 text-white/50 hover:bg-black/80 hover:text-white/80 shadow-lg"
                )}
              >
                {tick}
              </button>
            </LiquidMetalOptionBorder>
          </div>
        ))}
      </div>

      {/* Track */}
      <div className="relative h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.3),rgba(255,255,255,0.9))", boxShadow: "0 0 8px rgba(255,255,255,0.4)" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
        />
        <input type="range" min={1} max={5} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/30">{question.lowLabel}</span>
        <span className="text-[11px] uppercase tracking-wider text-white/30">{question.highLabel}</span>
      </div>
    </div>
  )
}

/** Custom time slider for sleep timing */
function TimeSliderInput({ question, value, onChange }: {
  question: TimeSliderQ; value: number; onChange: (v: number) => void
}) {
  const pct = ((value - question.minHour) / (question.maxHour - question.minHour)) * 100
  
  const formatHour = (h: number) => {
    let hour = h % 24
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12
    if (hour === 0) hour = 12
    return `${hour}:00 ${ampm}`
  }

  return (
    <div className="w-full space-y-5">
      {/* Value badge */}
      <div className="flex items-end justify-center gap-2">
        <motion.span
          key={value}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white tabular-nums leading-none drop-shadow-md"
        >
          {formatHour(value)}
        </motion.span>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner">
        <motion.div
           className="absolute inset-y-0 left-0 rounded-full"
           style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.4),rgba(255,255,255,1))", boxShadow: "0 0 12px rgba(255,255,255,0.6)" }}
           animate={{ width: `${pct}%` }}
           transition={{ type: "spring", stiffness: 300, damping: 26 }}
        />
        <input type="range" min={question.minHour} max={question.maxHour} step={question.step} value={value} onChange={(e) => onChange(+e.target.value)} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        <span className="text-xs uppercase tracking-wider text-white/60 font-bold drop-shadow">{formatHour(question.minHour)}</span>
        <span className="text-xs uppercase tracking-wider text-white/60 font-bold drop-shadow">{formatHour(question.maxHour)}</span>
      </div>
    </div>
  )
}

/** Budget slider with ₹ formatting */
function BudgetInput({ question, value, onChange }: {
  question: BudgetQ; value: number; onChange: (v: number) => void
}) {
  const budget = value || question.min
  const pct = ((budget - question.min) / (question.max - question.min)) * 100
  const fmt = (n: number) => `₹${(n / 1000).toFixed(0)}K`

  return (
    <div className="space-y-5">
      {/* Big display */}
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-white/30 mb-1">Monthly budget</span>
        <motion.span
          key={budget}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black text-white"
        >
          ₹{budget.toLocaleString("en-IN")}
        </motion.span>
      </div>

      {/* Track */}
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.3),rgba(255,255,255,0.9))", boxShadow: "0 0 10px rgba(255,255,255,0.4)" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
        />
        <input
          type="range"
          min={question.min} max={question.max} step={question.step}
          value={budget}
          onChange={(e) => onChange(+e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between">
        <span className="text-xs text-white/30">{fmt(question.min)}</span>
        <span className="text-xs text-white/30">{fmt(question.max)}</span>
      </div>

      {/* Quick-pick chips */}
      <div className="flex gap-2 flex-wrap">
        {[8000, 12000, 18000, 25000, 35000].map((v) => (
          <div key={v} className={cn("transition-transform duration-200", budget === v && "scale-105")}>
            <LiquidMetalOptionBorder active={budget === v} borderRadius={9999} borderWidth={1.5}>
              <button
                onClick={() => onChange(v)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium transition-colors backdrop-blur-[32px] block",
                  budget === v ? "bg-black/80 text-white font-bold shadow-md" : "bg-black/60 text-white/50 hover:bg-black/80 hover:text-white/80 shadow-lg"
                )}
              >
                {fmt(v)}
              </button>
            </LiquidMetalOptionBorder>
          </div>
        ))}
      </div>
    </div>
  )
}

/** MCQ — 4 full-width cards */
function MCQInput({ question, value, onChange }: {
  question: MCQQ; value: number | null; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-3">
      {question.options.map((opt, i) => {
        const sel = value === opt.value
        return (
          <motion.div
            key={opt.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn("w-full transition-transform duration-200", sel && "scale-[1.02]")}
          >
            <LiquidMetalOptionBorder active={sel} borderRadius={12} borderWidth={2}>
              <button
                onClick={() => onChange(opt.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-[10px] text-left transition-colors backdrop-blur-[32px]",
                  sel
                    ? "bg-black/80 text-white shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
                    : "bg-black/60 text-white/60 hover:bg-black/80 shadow-lg"
                )}
              >
                <span className="text-xl w-6 text-center flex-shrink-0">{opt.emoji}</span>
                <span className={cn("text-sm font-semibold flex-1 mb-[1px]", sel && "text-white")}>{opt.label}</span>
                {sel && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-black stroke-[3]" />
                  </motion.div>
                )}
              </button>
            </LiquidMetalOptionBorder>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Importance screen — shown after each accurate section */
function ImportanceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [
    { label: "Skip it", sub: "Not relevant to me", v: 1, color: "rgba(255,255,255,0.2)" },
    { label: "Low", sub: "Somewhat matters", v: 2, color: "rgba(100,200,255,0.7)" },
    { label: "Average", sub: "Moderate importance", v: 3, color: "rgba(255,220,100,0.8)" },
    { label: "High", sub: "Really matters to me", v: 4, color: "rgba(255,130,60,0.9)" },
    { label: "Critical", sub: "Deal-breaker territory", v: 5, color: "rgba(255,70,70,1)" },
  ]
  return (
    <div className="space-y-3">
      {levels.map((lv, i) => {
        const sel = value === lv.v
        return (
          <motion.div
            key={lv.v}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={cn("w-full transition-transform duration-250", sel && "scale-[1.02]")}
          >
            <LiquidMetalOptionBorder active={sel} borderRadius={16} borderWidth={2}>
              <button
                onClick={() => onChange(lv.v)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-[14px] text-left transition-colors backdrop-blur-2xl",
                  sel ? "bg-black/80" : "bg-black/60 hover:bg-black/80"
                )}
                style={sel ? { boxShadow: `0 0 20px ${lv.color}30` } : {}}
              >
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: sel ? lv.color : "rgba(255,255,255,0.1)" }} />
                <div className="flex-1">
                  <div className={cn("text-sm font-semibold", sel ? "text-white" : "text-white/45")}>{lv.label}</div>
                  <div className="text-xs text-white/25 mt-0.5">{lv.sub}</div>
                </div>
                {sel && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: lv.color }}>
                    <Check className="h-3 w-3 text-black stroke-[3]" />
                  </motion.div>
                )}
              </button>
            </LiquidMetalOptionBorder>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Mode selection — 3 white circles matching explore page style */
function ModeSelect({ onSelect }: { onSelect: (m: Mode) => void }) {
  const modeAccent: Record<Mode, { labelHover: string; ring: string; glowColor: "orange" | "blue" | "white" }> = {
    quick:   { labelHover: "group-hover:text-amber-400", ring: "hover:ring-amber-400/40",  glowColor: "orange" },
    accurate:{ labelHover: "group-hover:text-blue-400",  ring: "hover:ring-blue-400/40",   glowColor: "blue"   },
  }

  const modeInfo = {
    quick:    { emoji: "⚡", label: "Quick Match",    sub: "10 questions · ~5 min",  desc: "Fast compatibility based on key preferences" },
    accurate: { emoji: "🎯", label: "Accurate Match", sub: "36 questions · ~15 min", desc: "Deep compatibility across 6 life areas" },
  }

  const circles = [
    { id: "quick" as Mode,    icon: <Zap     className="h-12 w-12 text-black" strokeWidth={2.2} />, shortLabel: "Quick" },
    { id: "accurate" as Mode, icon: <Target   className="h-12 w-12 text-black" strokeWidth={2.2} />, shortLabel: "Accurate" },
  ]

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center px-6 py-16">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.04) 0%, transparent 60%)" }} />

      <div className="relative max-w-lg mx-auto w-full flex flex-col items-center gap-0">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14 space-y-2"
        >
          <p className="text-xs uppercase tracking-widest text-white/30 font-medium">Vibe Check</p>
          <h1 className="text-white text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
            How well do you want<br />us to match you?
          </h1>
          <p className="text-white/35 text-sm">More questions = better matches.</p>
        </motion.div>

        {/* ── Three white circles in one row ── */}
        <div className="flex flex-row items-start justify-center gap-12 md:gap-20 mb-14">
          {circles.map((item, i) => {
            const accent = modeAccent[item.id]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex flex-col items-center gap-4 group"
              >
                <button
                  onClick={() => onSelect(item.id)}
                  aria-label={modeInfo[item.id].label}
                  className={cn(
                    "h-28 w-28 md:h-32 md:w-32 rounded-full bg-white",
                    "flex items-center justify-center",
                    "ring-2 ring-transparent transition-all duration-300",
                    "hover:-translate-y-2 hover:shadow-2xl",
                    accent.ring,
                    "focus:outline-none focus-visible:ring-white/60"
                  )}
                >
                  {item.icon}
                </button>
                <span className={cn(
                  "text-sm font-medium tracking-wide transition-colors duration-300",
                  "text-white/40", accent.labelHover
                )}>
                  {item.shortLabel}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* ── GlowCards — decorative info only ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-row gap-3 w-full"
        >
          {(["quick", "accurate"] as Mode[]).map((mode, i) => {
            const info = modeInfo[mode]
            const glow = modeAccent[mode].glowColor
            // Inline glow card styles since we can't import GlowCard without circular deps
            const glowBase = { blue: 220, orange: 30, white: 0 }[glow]
            const glowSpread = glow === "blue" ? 200 : glow === "orange" ? 200 : 0
            return (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.07 }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 pointer-events-none select-none"
                style={{ "--base": glowBase, "--spread": glowSpread } as React.CSSProperties}
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <p className="text-white font-semibold text-xs leading-tight">{info.label}</p>
                    <p className="text-white/30 text-[9px] mt-0.5">{info.sub}</p>
                  </div>
                  <p className="text-white/40 text-[10px] leading-relaxed">{info.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

      </div>
    </div>
  )
}


/** Quick mode boost — pick 2 priorities */
function BoostSelect({ selected, onToggle, onDone }: {
  selected: string[]; onToggle: (id: string) => void; onDone: () => void
}) {
  return (
    <div className="min-h-screen bg-black relative flex flex-col justify-center px-5 py-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <Waves className="absolute inset-0 opacity-60 mix-blend-screen" backgroundColor="transparent" strokeColor="rgba(255, 255, 255, 0.4)" pointerSize={0} />
      </div>
      <div className="max-w-md mx-auto w-full space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-yellow-400/70">Optional Boost</p>
          <h2 className="text-2xl font-black text-white">What matters most<br />to you in a flatmate?</h2>
          <p className="text-white/40 text-sm">Pick 2 — those areas will count <span className="text-white/60 font-semibold">1.5× more</span> in your match score.</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {BOOST_OPTIONS.map((opt, i) => {
            const sel = selected.includes(opt.id)
            const maxed = !sel && selected.length >= 2
            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={cn("w-full transition-transform duration-200", sel && "scale-[1.02]")}
              >
                <LiquidMetalOptionBorder active={sel} borderRadius={16} borderWidth={2}>
                  <button
                    onClick={() => !maxed && onToggle(opt.id)}
                    className={cn(
                      "w-full h-full p-5 rounded-[14px] text-left transition-colors backdrop-blur-[32px] block",
                      sel 
                        ? "bg-black/80 text-white shadow-[0_4px_24px_rgba(255,255,255,0.15)]" 
                        : maxed 
                        ? "bg-black/40 text-white/40 cursor-not-allowed" 
                        : "bg-black/60 text-white/50 hover:bg-black/80 hover:text-white/80 shadow-lg"
                    )}
                  >
                    <div className="text-2xl mb-2">{opt.emoji}</div>
                    <div className={cn("text-sm font-bold", sel ? "text-yellow-300" : "text-white/70")}>{opt.label}</div>
                    <div className="text-xs text-white/30 mt-0.5">{opt.desc}</div>
                    {sel && (
                      <div className="mt-2 text-[10px] text-yellow-400/80 font-medium uppercase tracking-wider">×1.5 boost ✓</div>
                    )}
                  </button>
                </LiquidMetalOptionBorder>
              </motion.div>
            )
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onDone}
          className={cn(
            "w-full h-14 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
            selected.length > 0
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          )}
        >
          <Check className="h-5 w-5" />
          {selected.length === 0 ? "Skip boost & finish" : `Apply boost (${selected.length}/2) & finish`}
        </motion.button>
      </div>
    </div>
  )
}

/** Done screen — auto-redirects to /explore after 2.5s */
function VibeDoneScreen({ onNavigate }: { onNavigate: () => void }) {
  useEffect(() => {
    const t = setTimeout(onNavigate, 2500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="space-y-7 max-w-sm w-full"
      >
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Check className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">Vibe saved! 🎉</h1>
          <p className="text-white/45 text-sm leading-relaxed">
            Your compatibility profile is live. Taking you to your matches…
          </p>
        </div>
        {/* progress bar counting down */}
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "linear" }}
          />
        </div>
        <button
          onClick={onNavigate}
          className="w-full h-13 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all hover:scale-[1.02] text-base py-3.5"
        >
          See My Matches →
        </button>
      </motion.div>
    </main>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────

const getCardImage = (secId: string) => {
  const map: Record<string, string> = {
    sleep: "/sleep.jpg",
    clean: "/cleaning.jpg",
    finance: "/finance.jpg",
    social: "/social1.jpg",
    conflict: "/conflit.jpg",
    culture: "/culture.jpg",
  }
  return map[secId] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
}

const getCardImagePos = (secId: string) => {
  const map: Record<string, string> = {
    social: "50% 40%", // Tweak these percentages directly to perfectly frame the Otter and Beaver! (ex: "40% 50%", "center", "left center")
  }
  return map[secId] || "center"
}

function VibePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [phase, setPhase] = useState<Phase>("mode")
  const [mode, setMode] = useState<Mode | null>(null)
  const [screenIdx, setScreenIdx] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [importance, setImportance] = useState<Record<string, number>>(
    Object.fromEntries(ACCURATE_SECTIONS.map((s) => [s.id, 3]))
  )
  const [priorities, setPriorities] = useState<string[]>([])

  // On mount: if ?mode=quick|accurate is present, skip the mode picker
  // If no mode param, redirect to /explore (single mode-picker)
  useEffect(() => {
    const m = searchParams.get("mode") as Mode | null
    if (m === "quick" || m === "accurate") {
      setMode(m)
      setScreenIdx(0)
      setPhase("questions")
    } else if (m === null) {
      // Direct visit with no mode → send to single picker on /profile
      router.replace("/profile")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Which screen list to use
  const screens: ScreenItem[] = mode === "accurate" ? ACCURATE_SCREENS : (QUICK_QUESTIONS as ScreenItem[])
  const currentScreen = screens[screenIdx]
  const isImportance = currentScreen?.type === "importance"

  // Active section for gradient
  const activeSectionId = isImportance
    ? (currentScreen as ImportanceScreen).sectionId
    : ACCURATE_SECTIONS.find((s) => s.questions.some((q) => q.id === (currentScreen as VibeQuestion).id))?.id ?? "sleep"
  const activeSection = ACCURATE_SECTIONS.find((s) => s.id === activeSectionId) ?? ACCURATE_SECTIONS[0]

  // Quick mode: map question to a section for gradient
  const quickSectionMap: Record<string, string> = {
    q_sleep_timing: "sleep", q_sleep_noise: "sleep",
    q_clean_standard: "clean", q_clean_mess: "clean",
    q_social_level: "social", q_social_guests: "social",
    q_finance_expense: "finance", q_budget: "finance",
    q_conflict_style: "conflict", q_lifestyle_strict: "culture",
  }

  const bgSection = mode === "quick"
    ? (ACCURATE_SECTIONS.find((s) => s.id === quickSectionMap[(currentScreen as VibeQuestion)?.id]) ?? ACCURATE_SECTIONS[0])
    : activeSection

  // Progress
  const totalQ = screens.filter((s) => s.type !== "importance").length
  const answeredCount = Object.keys(answers).length
  const progressPct = Math.min((answeredCount / totalQ) * 100, 100)

  const currentValue = isImportance
    ? importance[(currentScreen as ImportanceScreen).sectionId]
    : (answers[(currentScreen as VibeQuestion)?.id] ?? null)

  // MCQ blocks advance on selection; importance/slider need explicit Continue
  const canAdvance = isImportance ? true : currentValue !== null

  const handleAnswer = useCallback((val: number) => {
    if (!currentScreen) return
    if (isImportance) {
      setImportance((p) => ({ ...p, [(currentScreen as ImportanceScreen).sectionId]: val }))
    } else {
      const id = (currentScreen as VibeQuestion).id
      setAnswers((p) => ({ ...p, [id]: val }))
    }
  }, [currentScreen, isImportance])

  const navigate = useCallback((delta: 1 | -1) => {
    const next = screenIdx + delta
    if (next < 0 || next >= screens.length) return
    setDir(delta)
    setScreenIdx(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [screenIdx, screens.length])

  const handleNext = () => {
    if (screenIdx < screens.length - 1) {
      navigate(1)
    } else if (mode === "quick") {
      setPhase("boost")
    } else {
      setPhase("done")
    }
  }

  const handleMode = (m: Mode) => {
    setMode(m)
    setScreenIdx(0)
    setPhase("questions")
  }

  const togglePriority = (id: string) => {
    setPriorities((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  }

  // ── Phase: done — navigate directly to profile ──────────────────────────
  useEffect(() => {
    if (phase === "done") {
      router.push("/profile")
    }
  }, [phase, router])

  // ── Phase: mode select — only shown if somehow mode is unset (not reachable via normal flow)
  if (phase === "mode") return null // redirect firing, show nothing

  // ── Phase: boost (quick only) ──────────────────────────────────────────────
  if (phase === "boost") return (
    <BoostSelect selected={priorities} onToggle={togglePriority} onDone={() => router.push("/profile")} />
  )

  if (phase === "done") {
    return null
  }

  // ── Phase: questions ───────────────────────────────────────────────────────

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40, filter: "blur(3px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40, filter: "blur(3px)" }),
  }

  // Section mini-dots for accurate mode
  const sectionQuestions = mode === "accurate"
    ? activeSection.questions
    : QUICK_QUESTIONS

  const questionInSection = !isImportance
    ? sectionQuestions.findIndex((q) => q.id === (currentScreen as VibeQuestion).id)
    : -1

  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div key={bgSection.id} className={`absolute inset-0 bg-gradient-to-b ${bgSection.gradient}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
        </AnimatePresence>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 0%,rgba(255,255,255,0.04),transparent 55%)" }} />
        <Waves className="absolute inset-0 opacity-60 mix-blend-screen" backgroundColor="transparent" strokeColor="rgba(255, 255, 255, 0.4)" pointerSize={0} />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-[2px] bg-white/[0.07]">
        <motion.div className="h-full" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.4),white)", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }}
          animate={{ width: `${progressPct}%` }} transition={{ duration: 0.35, ease: "easeOut" }} />
      </div>

      {/* Header row */}
      <div className="fixed top-2 inset-x-0 z-40 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => screenIdx > 0 ? navigate(-1) : router.push("/accuracy")}
          className="p-2 rounded-full bg-white/6 hover:bg-white/12 text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        {/* Mode badge */}
        <LiquidMetalOptionBorder
          active={true}
          borderRadius={9999}
          borderWidth={1.5}
          className="rounded-full shadow-lg"
        >
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-[24px] shadow-inner">
            {mode === "quick" ? <Zap className="h-3.5 w-3.5 text-yellow-400" /> : <Target className="h-3.5 w-3.5 text-blue-400" />}
            <span className="text-[11px] uppercase tracking-widest text-white/80 font-bold drop-shadow">
              {screenIdx + 1} / {screens.length}
            </span>
          </div>
        </LiquidMetalOptionBorder>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="min-h-screen flex flex-col justify-center items-center px-4 pt-20 pb-28">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={screenIdx} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 0.68, 0, 1] }} className="flex justify-center w-full">

              {isImportance ? (
                <div className="space-y-7 px-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{bgSection.emoji}</span>
                      <span className="text-xs uppercase tracking-widest text-white/30 font-medium">{bgSection.title}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-5 mt-2 w-full">
                      <div className="h-px flex-1 bg-white/10" />
                      <HoverBorderGradient
                        as="div"
                        containerClassName="pointer-events-none rounded-full"
                        className="bg-black text-[10px] font-bold uppercase tracking-widest text-white/60 px-4 py-1.5"
                      >
                        Section Complete
                      </HoverBorderGradient>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <h2 className="text-2xl font-black text-white leading-snug">
                      How much does{" "}
                      <span className="text-white/55">{(currentScreen as ImportanceScreen).sectionTitle}</span>{" "}
                      matter to you?
                    </h2>
                    <p className="text-white/30 text-xs leading-relaxed">
                      This weights your answers in this section for the compatibility score.
                    </p>
                  </div>
                  <ImportanceInput
                    value={importance[(currentScreen as ImportanceScreen).sectionId]}
                    onChange={handleAnswer}
                  />
                </div>
              ) : (
                <InteractiveProductCard
                  imageUrl={getCardImage(bgSection.id)}
                  imagePosition={getCardImagePos(bgSection.id)}
                  title={`${(currentScreen as VibeQuestion).emoji || ""} ${bgSection.title}`}
                  description={(currentScreen as VibeQuestion).text}
                >
                  <div className="pt-2">
                    {currentScreen.type === "slider" ? (
                      <SliderInput question={currentScreen as SliderQ} value={answers[(currentScreen as VibeQuestion).id] ?? 3} onChange={handleAnswer} />
                    ) : currentScreen.type === "time-slider" ? (
                      <TimeSliderInput question={currentScreen as TimeSliderQ} value={answers[(currentScreen as VibeQuestion).id] ?? (currentScreen as TimeSliderQ).minHour} onChange={handleAnswer} />
                    ) : currentScreen.type === "budget" ? (
                      <BudgetInput question={currentScreen as BudgetQ} value={answers[(currentScreen as VibeQuestion).id] ?? (currentScreen as BudgetQ).min} onChange={handleAnswer} />
                    ) : (
                      <MCQInput question={currentScreen as MCQQ} value={answers[(currentScreen as VibeQuestion).id] ?? null} onChange={handleAnswer} />
                    )}
                  </div>
                </InteractiveProductCard>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4">
        <div className="max-w-md mx-auto space-y-2">
          <motion.button
            onClick={canAdvance ? handleNext : undefined}
            animate={{ opacity: canAdvance ? 1 : 0.35 }}
            whileTap={canAdvance ? { scale: 0.97 } : {}}
            className={cn(
              "w-full h-13 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 py-3.5",
              canAdvance
                ? "bg-white text-black cursor-pointer shadow-[0_0_28px_rgba(255,255,255,0.12)]"
                : "bg-white/18 text-white/35 cursor-not-allowed"
            )}
          >
            {screenIdx === screens.length - 1
              ? mode === "quick" ? "See priority boost →" : <><Check className="h-4 w-4" /> Save my vibe</>
              : isImportance ? "Next section →"
              : currentScreen.type === "mcq" && !canAdvance ? "Tap an option to continue"
              : "Continue →"}
          </motion.button>
          <p className="text-center text-white/18 text-[9px] uppercase tracking-widest font-mono">
            {screenIdx + 1} of {screens.length}
          </p>
        </div>
      </div>
    </main>
  )
}

export default function VibePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <VibePageInner />
    </Suspense>
  )
}
