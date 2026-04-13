"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionValueEvent } from "motion/react"
import { useRouter } from "next/navigation"
import {
  MapPin, Briefcase, Filter, Search, Sparkles, X, Heart, Star, MessageCircle,
  Users, Home, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
  Moon, Coffee, Leaf, Dumbbell, Music2, BookOpen, Cigarette,
  Wine, Sun, Laptop, Utensils, PawPrint, Minimize2, TrendingUp,
  Wallet, UserCheck, Scale, ShieldCheck, Clock, CalendarDays, Dog, User, Loader2
} from "lucide-react"
import { NavigationBar } from "@/components/navigation-bar"
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid"
import { Person } from "@/app/explore/types"
import { MorphingCardStack } from "@/components/ui/morphing-card-stack"
import { HoverBorderCard } from "@/components/ui/hover-border-gradient"
import { getExploreFeed, recordSwipe } from "@/app/explore/actions"

// ─── Extended Person type with multi-image + detailed profile ──────────────────
export interface PersonExtended extends Omit<Person, "imageUrl"> {
  imageUrl: string
  images: string[]
  sleepScore: number    // 0-100 (0=early, 100=night owl)
  cleanScore: number
  socialScore: number
  moveIn: string
  pets?: string
  petImageUrl?: string  // photo of the actual pet
  hobbies: string[]
  dailyRoutine: string
  guestPolicy: string
  financialStyle: string
  conflictStyle: string
  dietaryPreference: string
}

// ─── Lifestyle icon map ────────────────────────────────────────────────────────
const LIFESTYLE_ICONS: Record<string, React.ReactNode> = {
  "Non-smoker": <Leaf className="h-4 w-4" />,
  "Smoker": <Cigarette className="h-4 w-4" />,
  "Social drinker": <Wine className="h-4 w-4" />,
  "Occasional drinks": <Wine className="h-4 w-4" />,
  "Teetotaler": <Leaf className="h-4 w-4" />,
  "Night Owl": <Moon className="h-4 w-4" />,
  "Late nights": <Moon className="h-4 w-4" />,
  "Early Bird": <Sun className="h-4 w-4" />,
  "Early Riser": <Sun className="h-4 w-4" />,
  "WFH": <Laptop className="h-4 w-4" />,
  "Gamer": <Dumbbell className="h-4 w-4" />,
  "Yoga": <Dumbbell className="h-4 w-4" />,
  "Coffee addict": <Coffee className="h-4 w-4" />,
  "Reader": <BookOpen className="h-4 w-4" />,
  "Musician": <Music2 className="h-4 w-4" />,
  "Vegetarian": <Utensils className="h-4 w-4" />,
  "Plant parent": <Leaf className="h-4 w-4" />,
  "Minimalist": <Minimize2 className="h-4 w-4" />,
  "No pets": <PawPrint className="h-4 w-4" />,
  "Foodie": <Utensils className="h-4 w-4" />,
  "Homebody": <Home className="h-4 w-4" />,
}

// ─── DB Profile → PersonExtended Mapper ────────────────────────────────────────
// Maps real DB profiles (from getExploreFeed) to the UI's PersonExtended shape.
function mapDbProfileToPersonExtended(p: any): PersonExtended {
  const sleepMap: Record<string, number> = { early: 20, flexible: 50, night: 80 }
  const cleanMap: Record<string, number> = { spotless: 95, tidy: 70, relaxed: 35 }
  const socialMap: Record<string, number> = { yes: 70, sometimes: 50, no: 25 }

  // Build lifestyle tags from profile fields
  const lifestyle: string[] = []
  if (p.smoking === "no") lifestyle.push("Non-smoker")
  else if (p.smoking === "yes") lifestyle.push("Smoker")
  if (p.drinking === "yes") lifestyle.push("Social drinker")
  else if (p.drinking === "sometimes") lifestyle.push("Occasional drinks")
  else if (p.drinking === "no") lifestyle.push("Teetotaler")
  if (p.sleepSchedule === "early") lifestyle.push("Early Riser")
  else if (p.sleepSchedule === "night") lifestyle.push("Night Owl")

  // Calculate age from DOB
  const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / 31557600000) : 0

  // Get avatar or placeholder
  const avatarUrl = p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.fullName || "?")}`

  return {
    id: p.id,
    name: p.fullName || "Unknown",
    age,
    occupation: p.occupation || "—",
    company: p.company || p.college || "",
    city: p.city || "—",
    area: p.listing?.location || p.city || "",
    bio: p.bio || "No bio yet.",
    imageUrl: avatarUrl,
    images: p.listing?.photos?.length ? p.listing.photos : [avatarUrl],
    matchScore: p.matchScore ?? 50,
    tags: (p.tags?.length ? p.tags : lifestyle).slice(0, 5),
    budget: p.listing?.rent ?? p.budget ?? 0,
    intent: (p.housingIntent || "join_room") as "join_room" | "have_room" | "team_up",
    sleepScore: sleepMap[p.sleepSchedule as string] ?? 50,
    cleanScore: cleanMap[p.cleanliness as string] ?? 50,
    socialScore: socialMap[p.drinking as string] ?? 40,
    moveIn: p.moveInFlexible ? "Flexible" : (p.moveInDate ? new Date(p.moveInDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Flexible"),
    pets: p.hasPet ? (p.petDescription || "Has a pet 🐾") : undefined,
    hobbies: p.tags?.slice(0, 4) || [],
    dailyRoutine: p.sleepSchedule === "early" ? "Early riser — up by 6 AM, structured routine." : p.sleepSchedule === "night" ? "Night owl — most productive after dark." : "Flexible schedule — goes with the flow.",
    guestPolicy: "—",
    financialStyle: "—",
    conflictStyle: "—",
    dietaryPreference: "—",
    lifestyle,
  }
}

// ─── Feed Generator ────────────────────────────────────────────────────────────
type ExtFeedItem = { id: string; type: "person"; person: PersonExtended }

function generateFeedFromProfiles(profiles: any[]): ExtFeedItem[] {
  return profiles.map(p => {
    const person = mapDbProfileToPersonExtended(p)
    return { id: String(person.id), type: "person" as const, person }
  })
}

// ─── Color helper ──────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  return s >= 90 ? "#34d399" : s >= 80 ? "#818cf8" : "#fbbf24"
}

// ─── Image Gallery (tap zones + dots) ──────────────────────────────────────────
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0)
  const total = images.length

  return (
    <div className="absolute inset-0 select-none">
      {/* Current image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx]}
        alt={`${name} photo ${idx + 1}`}
        className="absolute inset-0 w-full h-full object-cover object-top"
        draggable={false}
      />

      {/* Tap zones */}
      {total > 1 && (
        <>
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-20 focus:outline-none"
            onClick={(e) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)) }}
            aria-label="Previous photo"
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-20 focus:outline-none"
            onClick={(e) => { e.stopPropagation(); setIdx(i => Math.min(total - 1, i + 1)) }}
            aria-label="Next photo"
          />
        </>
      )}

      {/* Progress dots */}
      {total > 1 && (
        <div className="absolute top-2 inset-x-0 flex justify-center gap-1 z-30 px-4">
          {images.map((_, i) => (
            <div
              key={i}
              className="h-[2.5px] rounded-full flex-1 transition-all duration-300"
              style={{
                background: i === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                boxShadow: i === idx ? "0 0 6px rgba(255,255,255,0.4)" : "none"
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lifestyle Indicator Bar ───────────────────────────────────────────────────
function LifestyleBar({ label, insight, value, icon, color }: { label: string; insight: string; value: number; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-7 text-center">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/70 text-xs font-semibold">{label}</span>
          <span className="text-white/50 text-[10px] font-medium tracking-wide">{insight}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}90, ${color})` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Expanded Profile View ─────────────────────────────────────────────────────
function ExpandedProfile({ person, onClose }: { person: PersonExtended; onClose: () => void }) {
  const [showCompatibility, setShowCompatibility] = useState(false)
  const color = scoreColor(person.matchScore)
  const r = 44, circ = 2 * Math.PI * r, offset = circ - (person.matchScore / 100) * circ

  const bentoItems: BentoItem[] = [
    {
      title: "Financial Style",
      description: person.financialStyle,
      icon: <Wallet className="w-4 h-4 text-emerald-400" />,
      tags: ["Finance"],
      status: "Verified",
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "Guest Policy",
      description: person.guestPolicy,
      icon: <UserCheck className="w-4 h-4 text-blue-400" />,
      tags: ["Social"],
    },
    {
      title: "Conflict Resolution",
      description: person.conflictStyle,
      icon: <Scale className="w-4 h-4 text-purple-400" />,
      tags: ["Communication"],
    },
    {
      title: "Diet & Kitchen",
      description: person.dietaryPreference,
      icon: <Utensils className="w-4 h-4 text-amber-400" />,
      tags: ["Food"],
      colSpan: 2,
    },
  ]

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      className="fixed inset-0 z-[60] overflow-hidden"
    >
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
        {/* ─── Hero Gallery — card format ─── */}
        <div className="px-3 pt-14 pb-0">
          <div
            className="relative w-full rounded-3xl overflow-hidden"
            style={{ height: "42vh", minHeight: 260, maxHeight: 400 }}
          >
            <ImageGallery images={person.images} name={person.name} />



            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-xl border border-white/15"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>

            {/* Match pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-3 right-3 z-40 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-xl border"
              style={{ background: "rgba(0,0,0,0.55)", borderColor: `${color}55`, boxShadow: `0 0 16px ${color}50` }}
            >
              <Sparkles className="h-3 w-3" style={{ color }} />
              <span className="text-xs font-black" style={{ color }}>{person.matchScore}% Match</span>
            </motion.div>

            {/* Identity inside glass card */}
            <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none rounded-2xl p-4 border border-white/[0.08] overflow-hidden shadow-2xl">
              <div 
                className="absolute inset-0 z-[-1]"
                style={{
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              />
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-black text-[24px] leading-none drop-shadow-md"
              >
                {person.name}
                <span className="font-light text-white/70 ml-2 text-xl drop-shadow-sm">{person.age}</span>
              </motion.h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-white/80 drop-shadow-sm" />
                  <span className="text-white/90 text-[12px] font-medium drop-shadow-sm">{person.occupation} · {person.company}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-white/80 drop-shadow-sm" />
                  <span className="text-white/90 text-[12px] font-medium drop-shadow-sm">{person.area}, {person.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="px-4 pb-36 flex flex-col gap-4 mt-4">

          {/* Bio */}
          <div className="px-1 mb-2">
            <p className="text-white/85 text-[14px] leading-relaxed italic">&ldquo;{person.bio}&rdquo;</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {person.tags.slice(0, 3).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/8 border border-white/12 text-white/70">
                  {t}
                </span>
              ))}
              {person.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/8 border border-white/12 text-white/70">
                  +{person.tags.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Compatibility Expandable Card */}
          <HoverBorderCard>
            <div 
              className="relative rounded-[inherit] overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              
              {/* Header / Summary */}
              <div 
                className="p-4 flex items-center gap-4 cursor-pointer relative z-10"
                onClick={() => setShowCompatibility(!showCompatibility)}
              >
                <div className="flex-shrink-0 relative flex items-center justify-center w-14 h-14" style={{ width: 56, height: 56 }}>
                  <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                    <motion.circle
                      cx="50" cy="50" r={r}
                      stroke={color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                      fill="none"
                      style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
                    />
                  </svg>
                  <div className="flex flex-col items-center z-10">
                    <span className="font-black text-base text-white leading-none">{person.matchScore}</span>
                    <span className="text-white/40 text-[7px] font-bold uppercase tracking-widest">match</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-[15px] leading-none mb-1.5">{person.matchScore}% Compatibility</h3>
                    <motion.div
                      animate={{ rotate: showCompatibility ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </motion.div>
                  </div>
                  <p className="text-white/50 text-[11px] leading-snug">Based on habits, cleanliness &amp; lifestyle</p>
                </div>
              </div>

              {/* Expandable Breakdown */}
              <AnimatePresence>
                {showCompatibility && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative z-10"
                    style={{ overflow: "hidden" }}
                  >
                    <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 flex flex-col gap-3">
                      {bentoItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 py-1 relative z-10">
                          <div className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-0.5">{item.title}</p>
                            <p className="text-white/85 text-[13px] leading-snug">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </HoverBorderCard>

          {/* Practical Info Strip */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-2.5 text-center">
              <Wallet className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-0.5" />
              <div className="text-white font-black text-xs">₹{person.budget.toLocaleString("en-IN")}</div>
              <div className="text-white/35 text-[9px]">per month</div>
            </div>
            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-2.5 text-center">
              <CalendarDays className="h-3.5 w-3.5 text-blue-400 mx-auto mb-0.5" />
              <div className="text-white font-black text-xs">{person.moveIn}</div>
              <div className="text-white/35 text-[9px]">move-in</div>
            </div>
            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-2.5 text-center">
              <Home className="h-3.5 w-3.5 text-purple-400 mx-auto mb-0.5" />
              <div className="text-white font-black text-xs capitalize">{person.intent.replace("_", " ")}</div>
              <div className="text-white/35 text-[9px]">intent</div>
            </div>
          </div>

          {/* Lifestyle Snapshot — metallic */}
          <HoverBorderCard>
            <div
              className="relative rounded-[inherit] p-4 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <h3 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-4 relative z-10">Lifestyle Snapshot</h3>
              <div className="flex flex-col gap-4 relative z-10">
                <LifestyleBar 
                  label="Sleep Schedule" 
                  value={100 - person.sleepScore} 
                  insight={person.sleepScore <= 40 ? "Early Riser" : person.sleepScore >= 70 ? "Night Owl" : "Regular schedule"}
                  icon={person.sleepScore <= 40 ? "🌅" : "🌙"} 
                  color={person.sleepScore <= 40 ? "#34d399" : "#818cf8"} 
                />
                <LifestyleBar 
                  label="Cleanliness" 
                  value={person.cleanScore} 
                  insight={person.cleanScore >= 80 ? "Very clean & organized" : person.cleanScore >= 50 ? "Generally tidy" : "Relaxed about mess"}
                  icon="✨" 
                  color="#34d399" 
                />
                <LifestyleBar 
                  label="Social Level" 
                  value={person.socialScore} 
                  insight={person.socialScore >= 80 ? "Life of the party" : person.socialScore >= 50 ? "Enjoys good company" : "Values quiet time"}
                  icon="👥" 
                  color="#fbbf24" 
                />
              </div>
            </div>
          </HoverBorderCard>

          {/* Interesting Facts */}
          {person.prompts && person.prompts.length > 0 && (
            <HoverBorderCard>
              <div
                className="relative rounded-[inherit] py-4 overflow-hidden flex flex-col gap-3"
                style={{
                  background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
              >
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
                
                <div className="flex items-center gap-2 px-4 relative z-10">
                  <Sparkles className="h-3.5 w-3.5 text-white/50" />
                  <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest">Vibe &amp; Personality</h4>
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                  .fun-scroll::-webkit-scrollbar { height: 4px; }
                  .fun-scroll::-webkit-scrollbar-track { background: transparent; }
                  .fun-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
                  .fun-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
                `}} />
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-4 relative z-10 fun-scroll">
                  {person.prompts.map((p, i) => {
                    const emojis = ['🍝', '🎬', '☕', '🌿', '🎧', '🪴', '✈️', '🎮'];
                    const emoji = emojis[i % emojis.length];
                    return (
                      <div 
                        key={i} 
                        className="snap-start flex-shrink-0 w-[85%] h-[150px] rounded-2xl p-5 flex flex-col justify-between border border-white/[0.08]"
                        style={{
                          background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                        }}
                      >
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/[0.06] text-xl border border-white/10 shadow-inner">
                          {emoji}
                        </div>
                        <div>
                          <p className="text-white/90 text-[14px] font-bold leading-relaxed drop-shadow-sm line-clamp-2 mb-1">{p.answer}</p>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider line-clamp-1">{p.question}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </HoverBorderCard>
          )}

          {/* Pets */}
          {person.pets && (
            <HoverBorderCard>
              <div
                className="relative overflow-hidden rounded-[inherit]"
                style={{
                  background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
              >
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
                {/* Info row */}
                <div className="flex items-center gap-3 p-4 relative z-10">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.08] border border-white/12 flex items-center justify-center flex-shrink-0">
                    <Dog className="h-5 w-5 text-white/60" />
                  </div>
                  <div>
                    <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-1">Pet Companion</h4>
                    <p className="text-white/90 text-sm font-medium">{person.pets}</p>
                  </div>
                </div>
                {/* Pet photo */}
                {person.petImageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    className="relative w-full z-10"
                    style={{ height: 220 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={person.petImageUrl}
                      alt={person.pets}
                      className="w-full h-full object-cover object-top"
                      draggable={false}
                    />
                  </motion.div>
                )}
              </div>
            </HoverBorderCard>
          )}

          {/* Daily Routine — matte metallic */}
          <HoverBorderCard>
            <div
              className="relative rounded-[inherit] p-4 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <Clock className="h-3.5 w-3.5 text-white/50" />
                <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest">Daily Routine</h4>
              </div>
              <p className="text-white/80 text-[13px] leading-relaxed relative z-10">{person.dailyRoutine}</p>
            </div>
          </HoverBorderCard>

          {/* Hobbies — matte metallic */}
          <HoverBorderCard>
            <div
              className="relative rounded-[inherit] p-4 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-2.5 relative z-10">Hobbies & Interests</h4>
              <div className="flex flex-wrap gap-1.5 relative z-10">
                {person.hobbies.map(h => (
                  <span key={h} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.06] border border-white/10 text-white/70">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </HoverBorderCard>




          {/* Lifestyle Habits — matte metallic */}
          {person.lifestyle && person.lifestyle.length > 0 && (
            <HoverBorderCard>
              <div
                className="relative rounded-[inherit] p-4 pb-6 overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
              >
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
                <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-2.5 relative z-10">Lifestyle Habits</h4>
                <div className="flex flex-wrap gap-1.5 relative z-10">
                  {person.lifestyle.map((l) => (
                    <span key={l} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.06] border border-white/10 text-white/70">
                      {LIFESTYLE_ICONS[l] ?? <Leaf className="h-3 w-3" />}
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </HoverBorderCard>
          )}
        </div>
      </div>

    </motion.div>
  )
}

// ─── Inline Scrollable Person Card ─────────────────────────────────────────────
function PersonScrollCard({ person }: { person: PersonExtended }) {
  const [showCompatibility, setShowCompatibility] = useState(false)
  const color = scoreColor(person.matchScore)
  const r = 44, circ = 2 * Math.PI * r, offset = circ - (person.matchScore / 100) * circ

  const bentoItems: BentoItem[] = [
    {
      title: "Financial Style",
      description: person.financialStyle,
      icon: <Wallet className="w-4 h-4 text-emerald-400" />,
      tags: ["Finance"],
      status: "Verified",
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "Guest Policy",
      description: person.guestPolicy,
      icon: <UserCheck className="w-4 h-4 text-blue-400" />,
      tags: ["Social"],
    },
    {
      title: "Conflict Resolution",
      description: person.conflictStyle,
      icon: <Scale className="w-4 h-4 text-purple-400" />,
      tags: ["Communication"],
    },
    {
      title: "Diet & Kitchen",
      description: person.dietaryPreference,
      icon: <Utensils className="w-4 h-4 text-amber-400" />,
      tags: ["Food"],
      colSpan: 2,
    },
  ]

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
      {/* ── Hero Photo Card ── */}
      <div className="px-3 pt-3 pb-0">
        {/* Photo card with rounded corners — face-focused */}
        <div
          className="relative w-full rounded-3xl overflow-hidden select-none"
          style={{ height: "58vh", minHeight: 320, maxHeight: 480 }}
        >
          <ImageGallery images={person.images} name={person.name} />



          {/* Match pill — top right inside card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-xl border"
            style={{ background: "rgba(0,0,0,0.55)", borderColor: `${color}50`, boxShadow: `0 0 14px ${color}40` }}
          >
            <Sparkles className="h-2.5 w-2.5" style={{ color }} />
            <span className="text-[11px] font-black" style={{ color }}>{person.matchScore}%</span>
          </motion.div>

          {/* Identity & Tags inside glass card */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2.5 pointer-events-none rounded-2xl p-4 border border-white/[0.08] overflow-hidden shadow-2xl">
            <div 
              className="absolute inset-0 z-[-1]"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            />
            {/* Identity row */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 drop-shadow-md">
                  <h2 className="text-white font-black text-[22px] leading-none truncate">{person.name}</h2>
                  <span className="text-white/70 font-light text-lg flex-shrink-0">{person.age}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 drop-shadow-sm">
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-white/80 flex-shrink-0" />
                    <span className="text-white/90 text-[11px] truncate font-medium">{person.occupation} · {person.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-white/80 flex-shrink-0" />
                    <span className="text-white/90 text-[11px] font-medium">{person.area}, {person.city}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {person.tags.slice(0, 3).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/50 backdrop-blur-sm text-white/90 border border-white/15">
                  {t}
                </span>
              ))}
              {person.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/50 backdrop-blur-sm text-white/90 border border-white/15">
                  +{person.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Details ── */}
      <div className="px-4 pb-36 flex flex-col gap-4">

          {/* Bio */}
          <HoverBorderCard>
            <div
              className="relative rounded-[inherit] p-4 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <User className="h-3.5 w-3.5 text-white/50" />
                <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest">About {person.name.split(' ')[0]}</h4>
              </div>
              <p className="text-white/85 text-[14px] leading-relaxed relative z-10 italic">&ldquo;{person.bio}&rdquo;</p>
            </div>
          </HoverBorderCard>

          {/* Compatibility Expandable Card */}
          <HoverBorderCard>
            <div 
              className="relative rounded-[inherit] overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              
              {/* Header / Summary */}
              <div 
                className="p-4 flex items-center gap-4 cursor-pointer relative z-10"
                onClick={() => setShowCompatibility(!showCompatibility)}
              >
                <div className="flex-shrink-0 relative flex items-center justify-center w-14 h-14" style={{ width: 56, height: 56 }}>
                  <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                    <motion.circle
                      cx="50" cy="50" r={r}
                      stroke={color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      whileInView={{ strokeDashoffset: offset }}
                      viewport={{ once: true, margin: "-10px" }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
                      fill="none"
                      style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
                    />
                  </svg>
                  <div className="flex flex-col items-center z-10">
                    <span className="font-black text-base text-white leading-none">{person.matchScore}</span>
                    <span className="text-white/40 text-[7px] font-bold uppercase tracking-widest">match</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-[15px] leading-none mb-1.5">{person.matchScore}% Compatibility</h3>
                    <motion.div
                      animate={{ rotate: showCompatibility ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </motion.div>
                  </div>
                  <p className="text-white/50 text-[11px] leading-snug">Based on habits, cleanliness &amp; lifestyle</p>
                </div>
              </div>

              {/* Expandable Breakdown */}
              <AnimatePresence>
                {showCompatibility && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative z-10"
                    style={{ overflow: "hidden" }}
                  >
                    <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 flex flex-col gap-3">
                      {bentoItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 py-1 relative z-10">
                          <div className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-0.5">{item.title}</p>
                            <p className="text-white/85 text-[13px] leading-snug">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </HoverBorderCard>

        {/* Practical Info Strip */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Per month */}
          <HoverBorderCard containerClassName="rounded-xl">
            <div
              className="relative rounded-[inherit] p-2.5 text-center overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <Wallet className="h-3.5 w-3.5 text-white/50 mx-auto mb-0.5 relative z-10" />
              <div className="text-white font-black text-xs relative z-10">₹{person.budget.toLocaleString("en-IN")}</div>
              <div className="text-white/40 text-[9px] relative z-10">per month</div>
            </div>
          </HoverBorderCard>

          {/* Move-in */}
          <HoverBorderCard containerClassName="rounded-xl">
            <div
              className="relative rounded-[inherit] p-2.5 text-center overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <CalendarDays className="h-3.5 w-3.5 text-white/50 mx-auto mb-0.5 relative z-10" />
              <div className="text-white font-black text-xs relative z-10">{person.moveIn}</div>
              <div className="text-white/40 text-[9px] relative z-10">move-in</div>
            </div>
          </HoverBorderCard>

          {/* Intent */}
          <HoverBorderCard containerClassName="rounded-xl">
            <div
              className="relative rounded-[inherit] p-2.5 text-center overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <Home className="h-3.5 w-3.5 text-white/50 mx-auto mb-0.5 relative z-10" />
              <div className="text-white font-black text-xs capitalize relative z-10">{person.intent.replace("_", " ")}</div>
              <div className="text-white/40 text-[9px] relative z-10">intent</div>
            </div>
          </HoverBorderCard>
        </div>

        {/* Lifestyle Snapshot — matte metallic */}
        <HoverBorderCard>
          <div
            className="relative rounded-[inherit] p-4 overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
            <h3 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-4 relative z-10">Lifestyle Snapshot</h3>
            <div className="flex flex-col gap-4 relative z-10">
              <LifestyleBar 
                label="Sleep Schedule" 
                value={100 - person.sleepScore} 
                insight={person.sleepScore <= 40 ? "Early Riser" : person.sleepScore >= 70 ? "Night Owl" : "Regular schedule"}
                icon={person.sleepScore <= 40 ? "🌅" : "🌙"} 
                color={person.sleepScore <= 40 ? "#34d399" : "#818cf8"} 
              />
              <LifestyleBar 
                label="Cleanliness" 
                value={person.cleanScore} 
                insight={person.cleanScore >= 80 ? "Very clean & organized" : person.cleanScore >= 50 ? "Generally tidy" : "Relaxed about mess"}
                icon="✨" 
                color="#34d399" 
              />
              <LifestyleBar 
                label="Social Level" 
                value={person.socialScore} 
                insight={person.socialScore >= 80 ? "Life of the party" : person.socialScore >= 50 ? "Enjoys good company" : "Values quiet time"}
                icon="👥" 
                color="#fbbf24" 
              />
            </div>
          </div>
        </HoverBorderCard>

        {/* Interesting Facts */}
        {person.prompts && person.prompts.length > 0 && (
          <HoverBorderCard>
            <div
              className="relative rounded-[inherit] py-4 overflow-hidden flex flex-col gap-3"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              
              <div className="flex items-center gap-2 px-4 relative z-10">
                <Sparkles className="h-3.5 w-3.5 text-white/50" />
                <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest">Vibe &amp; Personality</h4>
              </div>
              
              <style dangerouslySetInnerHTML={{__html: `
                .fun-scroll::-webkit-scrollbar { height: 4px; }
                .fun-scroll::-webkit-scrollbar-track { background: transparent; }
                .fun-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
                .fun-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
              `}} />
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-4 relative z-10 fun-scroll">
                {person.prompts.map((p, i) => {
                  const emojis = ['🍝', '🎬', '☕', '🌿', '🎧', '🪴', '✈️', '🎮'];
                  const emoji = emojis[i % emojis.length];
                  return (
                    <div 
                      key={i} 
                      className="snap-start flex-shrink-0 w-[85%] h-[150px] rounded-2xl p-5 flex flex-col justify-between border border-white/[0.08]"
                      style={{
                        background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                      }}
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/[0.06] text-xl border border-white/10 shadow-inner">
                        {emoji}
                      </div>
                      <div>
                        <p className="text-white/90 text-[14px] font-bold leading-relaxed drop-shadow-sm line-clamp-2 mb-1">{p.answer}</p>
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider line-clamp-1">{p.question}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </HoverBorderCard>
        )}

        {/* Pet Companion — metallic */}
        {person.pets && (
          <HoverBorderCard>
            <div
              className="relative overflow-hidden rounded-[inherit]"
              style={{
                background: "linear-gradient(145deg, #1e180a 0%, #2a2010 40%, #1a1808 70%, #241e0e 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px rgba(251,191,36,0.06)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 55%, transparent 100%)" }} />
              <h4 className="text-amber-400/60 text-[10px] uppercase font-black tracking-widest px-4 pt-4 mb-3 relative z-10">Pet Companion</h4>
              {/* Pet photo */}
              {person.petImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                  className="relative w-full mx-0 z-10"
                  style={{ height: 200 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.petImageUrl} alt={person.pets} className="w-full h-full object-cover" draggable={false} />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
                </motion.div>
              )}
              {/* Pet name below photo */}
              <div className="flex items-center gap-2.5 px-4 py-3 relative z-10">
                <div className="h-8 w-8 rounded-lg bg-white/[0.08] border border-white/12 flex items-center justify-center flex-shrink-0">
                  <Dog className="h-4 w-4 text-white/60" />
                </div>
                <p className="text-white/90 text-sm font-semibold">{person.pets}</p>
              </div>
            </div>
          </HoverBorderCard>
        )}

        {/* Daily Routine — metallic */}
        <HoverBorderCard>
          <div
            className="relative rounded-[inherit] p-4 overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Clock className="h-3.5 w-3.5 text-white/50" />
              <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest">Daily Routine</h4>
            </div>
            <p className="text-white/80 text-[13px] leading-relaxed relative z-10">{person.dailyRoutine}</p>
          </div>
        </HoverBorderCard>

        {/* Hobbies — metallic */}
        <HoverBorderCard>
          <div
            className="relative rounded-[inherit] p-4 overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
            <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-2.5 relative z-10">Hobbies &amp; Interests</h4>
            <div className="flex flex-wrap gap-1.5 relative z-10">
              {person.hobbies.map(h => (
                <span key={h} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.06] border border-white/10 text-white/70">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </HoverBorderCard>



        {/* Lifestyle Habits — metallic */}
        {person.lifestyle && person.lifestyle.length > 0 && (
          <HoverBorderCard>
            <div
              className="relative rounded-[inherit] p-4 pb-6 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #111111 0%, #191919 30%, #0d0d0d 60%, #151515 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 55%, transparent 100%)" }} />
              <h4 className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-2.5 relative z-10">Lifestyle Habits</h4>
              <div className="flex flex-wrap gap-1.5 relative z-10">
                {person.lifestyle.map((l) => (
                  <span key={l} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.06] border border-white/10 text-white/70">
                    {LIFESTYLE_ICONS[l] ?? <Leaf className="h-3 w-3" />}
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </HoverBorderCard>
        )}

      </div>
    </div>
  )
}

// ─── Swipe Card Container ──────────────────────────────────────────────────────
function SwipeCard({
  item, onSwipe, isTop, zIndex,
}: {
  item: ExtFeedItem
  onSwipe: (dir: "left" | "right" | "super") => void
  isTop: boolean
  zIndex: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-16, 16])
  const likeOpacity = useTransform(x, [35, 110], [0, 1])
  const nopeOpacity = useTransform(x, [-110, -35], [1, 0])
  const rightGlow = useTransform(x, [0, 110], [0, 1])
  const leftGlow = useTransform(x, [-110, 0], [1, 0])

  // Track whether user is scrolled down in the card (to block swipe when scrolled)
  const isScrolled = useRef(false)

  const [exitX, setExitX] = useState<number | null>(null)

  // Haptic tick when crossing threshold
  useMotionValueEvent(x, "change", (latestX) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      const prevX = x.getPrevious() || 0
      if ((latestX > 80 && prevX <= 80) || (latestX < -80 && prevX >= -80)) {
        window.navigator.vibrate(15) 
      }
    }
  })

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number } }) => {
    if (!isTop) return
    if (isScrolled.current) return // Don't swipe if user has scrolled into the card
    
    if (info.offset.x > 80 || info.velocity.x > 400) {
      window.navigator.vibrate?.([30, 40])
      setExitX(typeof window !== "undefined" ? window.innerWidth + 100 : 1000)
      setTimeout(() => onSwipe("right"), 150)
    } else if (info.offset.x < -80 || info.velocity.x < -400) {
      window.navigator.vibrate?.([30, 40])
      setExitX(typeof window !== "undefined" ? -window.innerWidth - 100 : -1000)
      setTimeout(() => onSwipe("left"), 150)
    }
  }

  const isPerson = item.type === "person"

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0"
      style={{ x: isTop && exitX === null ? x : undefined, rotate: isTop && exitX === null ? rotate : undefined, zIndex, willChange: isTop ? "transform" : "auto" }}
      drag={isTop && exitX === null ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.94, y: isTop ? 0 : 22 }}
      animate={
        exitX !== null 
          ? { x: exitX, rotate: exitX > 0 ? 15 : -15, opacity: 0 } 
          : { scale: isTop ? 1 : 0.94, y: isTop ? 0 : 22, opacity: 1 }
      }
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: exitX !== null ? 150 : 280, damping: exitX !== null ? 22 : 28 }}
    >
      <div className="relative w-full h-full md:rounded-[32px] rounded-[20px] overflow-hidden shadow-2xl bg-[#080808]">
        {/* Edge light */}
        <div className="absolute inset-0 pointer-events-none z-[5] rounded-[inherit]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)" }} />

        {/* Swipe glow */}
        {isTop && (
          <>
            <motion.div className="absolute inset-0 z-[4] pointer-events-none rounded-[inherit] bg-emerald-400/20" style={{ opacity: rightGlow }} />
            <motion.div className="absolute inset-0 z-[4] pointer-events-none rounded-[inherit] bg-red-500/20" style={{ opacity: leftGlow }} />
          </>
        )}

        {/* Content */}
        <div className="absolute inset-0 overflow-hidden">
          {isPerson && (
            <div
              ref={scrollRef}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden"
              style={{ scrollbarWidth: "none" }}
              onScroll={(e) => {
                isScrolled.current = (e.currentTarget.scrollTop > 10)
              }}
              onPointerDown={(e) => {
                // Only block drag propagation when user is scrolled down
                if (isScrolled.current) e.stopPropagation()
              }}
            >
              <PersonScrollCard person={item.person} />
            </div>
          )}
        </div>

        {/* LIKE / NOPE stamps */}
        {isTop && (
          <div className="pointer-events-none inset-0 absolute overflow-hidden rounded-[inherit] z-20">
            <motion.div style={{ opacity: likeOpacity, willChange: "opacity" }} className="absolute top-28 left-6 rotate-[-18deg]">
              <div className="border-[3px] border-emerald-400 rounded-2xl px-4 py-2 bg-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                <span className="text-emerald-400 font-black text-4xl tracking-widest uppercase drop-shadow-xl">LIKE</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity, willChange: "opacity" }} className="absolute top-28 right-6 rotate-[18deg]">
              <div className="border-[3px] border-red-500 rounded-2xl px-4 py-2 bg-red-400/20 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                <span className="text-red-500 font-black text-4xl tracking-widest uppercase drop-shadow-xl">NOPE</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
      >
        <Sparkles className="h-10 w-10 text-white/30" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">All caught up!</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          You&apos;ve seen everyone nearby. Check back later or adjust your filters.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        onClick={onReset}
        className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm shadow-xl"
      >
        Start Over ↺
      </motion.button>
    </motion.div>
  )
}

// ─── Match Celebration Overlay ─────────────────────────────────────────────────
function MatchCelebration({ name, onContinue, onChat }: { name: string; onContinue: () => void; onChat: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.8)" }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="flex flex-col items-center gap-6 text-center px-8"
      >
        {/* Animated hearts */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_60px_rgba(52,211,153,0.4)]"
          >
            <Heart className="h-12 w-12 text-white fill-white" />
          </div>
          {/* Sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.5, 0], opacity: [1, 1, 0], x: [0, (i % 2 ? 1 : -1) * (30 + i * 15)], y: [0, -(20 + i * 12)] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-300"
            />
          ))}
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-black text-white"
        >
          It&apos;s a Match! 🎉
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-white/60 text-sm"
        >
          You and {name.split(" ")[0]} both liked each other!
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 mt-4"
        >
          <button
            onClick={onChat}
            className="px-8 py-3 rounded-2xl bg-white text-black font-bold text-sm shadow-xl hover:scale-105 transition-transform"
          >
            Send a Message 💬
          </button>
          <button
            onClick={onContinue}
            className="px-6 py-3 rounded-2xl bg-white/10 text-white border border-white/20 font-bold text-sm hover:bg-white/20 transition-colors"
          >
            Keep Swiping
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ─── Loading State ──────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-10 w-10 text-white/30" />
      </motion.div>
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-bold text-white">Finding your people...</h2>
        <p className="text-white/40 text-xs">ML compatibility engine scoring profiles</p>
      </div>
    </div>
  )
}

// ─── Main Explore Page ─────────────────────────────────────────────────────────
function getItemName(item: ExtFeedItem): string {
  if (item.type === "person") return item.person.name
  return "Item"
}

export default function ExplorePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<ExtFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastAction, setLastAction] = useState<{ name: string; dir: string } | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [matchInfo, setMatchInfo] = useState<{ name: string; matchId: string } | null>(null)

  // Fetch real profiles from DB with ML scoring
  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getExploreFeed()
      if (result.profiles && result.profiles.length > 0) {
        setQueue(generateFeedFromProfiles(result.profiles))
      } else {
        setQueue([])
      }
    } catch (err) {
      console.error("Failed to load feed:", err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  const topItem = queue[0]
  const secondItem = queue[1]

  const handleSwipe = useCallback(async (dir: "left" | "right" | "super") => {
    if (!topItem) return
    const person = topItem.person
    const label = dir === "right" ? "❤️ Liked" : dir === "super" ? "⚡ Super Like" : "✕ Passed"
    setLastAction({ name: person.name, dir: label })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
    setQueue(q => q.slice(1))

    // Record swipe in DB (fire-and-forget for speed, but check for match)
    const direction = dir === "right" ? "like" : dir === "super" ? "super" : "pass"
    try {
      const result = await recordSwipe(String(person.id), direction)
      if ("matched" in result && result.matched && "matchId" in result && result.matchId) {
        // Trigger match celebration!
        setMatchInfo({ name: person.name, matchId: result.matchId })
        window.navigator?.vibrate?.([30, 50, 80, 50, 30])
      }
    } catch (err) {
      console.error("Swipe error:", err)
    }
  }, [topItem])

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Dark phone column — max 430px, white page shows on sides on desktop */}
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl">

        <NavigationBar />

        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-10 pb-3 pointer-events-none">
          <div className="pointer-events-auto">
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              className="h-9 w-9 rounded-full flex items-center justify-center border border-white/12 bg-black/40 backdrop-blur-xl text-white hover:bg-white/15 transition-all shadow-xl"
            >
              <Filter className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              onClick={() => router.push("/profile")}
              className="h-9 w-9 rounded-full flex items-center justify-center border border-white/12 bg-black/40 backdrop-blur-xl text-white hover:bg-white/15 transition-all shadow-xl"
            >
              <Search className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Card stack */}
        <div className="absolute inset-0 pb-[80px] pt-0 flex justify-center overflow-hidden">
          <div className="relative w-full h-full">
            <AnimatePresence>
              {loading ? (
                <motion.div key="loading" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingState />
                </motion.div>
              ) : queue.length === 0 ? (
                <motion.div key="empty" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState onReset={loadFeed} />
                </motion.div>
              ) : (
                <>
                  {secondItem && (
                    <SwipeCard key={`back-${secondItem.id}`} item={secondItem} onSwipe={handleSwipe} isTop={false} zIndex={10} />
                  )}
                  <SwipeCard key={`top-${topItem.id}`} item={topItem} onSwipe={handleSwipe} isTop={true} zIndex={20} />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {showToast && lastAction && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="absolute top-32 inset-x-0 flex justify-center z-50 pointer-events-none"
            >
              <div
                className="px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-2xl text-sm font-bold text-white tracking-wide"
                style={{ background: "rgba(0,0,0,0.5)", boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }}
              >
                {lastAction.dir} {lastAction.name.split(" ")[0]}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Celebration */}
        <AnimatePresence>
          {matchInfo && (
            <MatchCelebration
              name={matchInfo.name}
              onChat={() => {
                router.push(`/chat/${matchInfo.matchId}`)
                setMatchInfo(null)
              }}
              onContinue={() => setMatchInfo(null)}
            />
          )}
        </AnimatePresence>

      </div>
    </main>
  )
}
