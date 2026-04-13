"use client"

import React from "react"
import { motion } from "motion/react"
import { MapPin, Users, Sparkles, AlertTriangle, CheckCircle2, Calendar, Target, Trophy } from "lucide-react"
import { RoomItem, GroupItem, InsightItem, EventItem, NudgeItem } from "@/app/explore/types"

// ─── Shared Styles ────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "linear-gradient(to bottom, #080808, #050505)",
}

// ─── Room Card ────────────────────────────────────────────────────────────────
export function RoomCard({ item }: { item: RoomItem }) {
  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 px-5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="relative w-full rounded-[24px] overflow-hidden" style={{ height: "45vh", minHeight: 300 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full w-fit backdrop-blur-md bg-white/10 border border-white/20">
            <Users className="h-3.5 w-3.5 text-white" />
            <span className="text-white text-[11px] font-bold">
              {item.totalSpots - item.spotsLeft} people already living
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-black text-white leading-tight">{item.title}</h2>
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-white leading-none">₹{item.price.toLocaleString("en-IN")}</span>
            <span className="text-white/40 text-[10px]">per month</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-white/50">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">{item.area}, {item.city}</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {item.tags.map(t => (
            <span key={t} className="px-3 py-1.5 rounded-[12px] bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 text-center">
          <span className="text-emerald-400 font-bold text-sm">{item.spotsLeft} spot left!</span>
        </div>
      </div>
    </div>
  )
}

// ─── Group Match Card ─────────────────────────────────────────────────────────
export function GroupCard({ item }: { item: GroupItem }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center pt-6 pb-24 px-8 text-center">
      <div className="flex -space-x-4 mb-6">
        {item.members.map((m, i) => (
          <div key={i} className="h-16 w-16 rounded-full border-[3px] border-[#080808] bg-neutral-800 overflow-hidden flex items-center justify-center transform transition-transform hover:scale-110 hover:z-10 z-0">
            {m.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white/50 font-black text-sm">{m.name.charAt(0)}</span>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-3xl font-black text-white leading-tight mb-2">
        {item.members.map(m => m.name).join(" + ")}
      </h2>
      
      <div className="mt-6 border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_40px_rgba(52,211,153,0.15)] rounded-full px-6 py-2.5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <span className="text-emerald-400 text-lg font-black">{item.matchScore}% combined match</span>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {item.tags.map(t => (
          <span key={t} className="px-3 py-1.5 rounded-[12px] bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
export function InsightCard({ item }: { item: InsightItem }) {
  return (
    <div className="w-full h-full flex flex-col justify-center px-8 text-center" style={cardStyle}>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="mb-8 flex justify-center"
      >
        <Sparkles className="h-12 w-12 text-[#f59e0b]" />
      </motion.div>
      <h2 className="text-2xl font-black text-white leading-tight mb-8">
        You match best with <span className="text-[#f59e0b]">{item.targetName}</span> because:
      </h2>
      <div className="flex flex-col gap-4 text-left inset-x-0 max-w-sm mx-auto">
        {item.pros.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 * i }}
            className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-[16px]"
          >
            <CheckCircle2 className="h-6 w-6 text-[#f59e0b] flex-shrink-0" />
            <span className="text-white font-medium text-base">{p}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────
export function EventCard({ item }: { item: EventItem }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative w-full h-1/2 min-h-[300px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent" />
      </div>
      <div className="flex-1 flex flex-col justify-end px-6 pb-20 z-10 -mt-20">
        <h2 className="text-3xl font-black text-white leading-tight mb-4">{item.title}</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-white/60">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-medium">{item.date}</span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <MapPin className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-medium">{item.location}</span>
          </div>
        </div>
        <div className="mt-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[20px] p-4 text-center">
          <p className="text-indigo-400 font-bold text-sm">
            {item.attendees} people from your matches are going!
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Nudge Card ───────────────────────────────────────────────────────────────
export function NudgeCard({ item }: { item: NudgeItem }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 text-center" style={cardStyle}>
      <Trophy className="h-16 w-16 text-emerald-400 mb-6" />
      <h2 className="text-3xl font-black text-white leading-tight mb-4">{item.title}</h2>
      <p className="text-white/60 text-base mb-10">{item.description}</p>
      
      <button className="w-full max-w-sm py-4 rounded-full bg-white text-black font-black text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
        {item.actionLabel}
      </button>
      <button className="mt-4 text-white/30 text-sm font-medium hover:text-white/60">
        Maybe later
      </button>
    </div>
  )
}
