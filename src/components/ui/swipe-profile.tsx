"use client"

import React, { useRef, useState } from "react"
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from "motion/react"
import { Heart, X, Info, Home, Users, MapPin, DollarSign, Target, CheckCircle2, ChevronUp, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"

// Needs to match the main type
export interface ProfileTraits {
  sleep: "Early" | "Late" | "Flexible"
  cleanliness: number // 1-5
  social: number // 1-5
  guests: "Low" | "Medium" | "High"
}

export interface Flatmate {
  name: string;
  age: number;
  occupation: string;
  traits: string[];
  detailedTraits?: ProfileTraits;
  bio?: string;
  budget?: number;
  moveIn?: string;
  prompts?: { question: string, answer: string }[];
  matchScore?: number;
}

export interface ProfileListing {
  id: string
  name: string
  age: number
  images: string[]
  occupation: string
  collegeOrCompany?: string
  city: string
  area: string
  budget: number
  matchScore?: number
  tags: string[] // e.g., ["Early sleeper", "Clean", "Non-smoker"]
  bio: string
  traits: ProfileTraits
  moveIn: string
  intent: "looking_room" | "have_room" | "form_group"
  aiHighlight?: string
  groupMatchText?: string
  flatDetails?: {
    type: string;
    occupancy: string;
    spots: string;
    groupMatchScore?: number;
    flatmates: Flatmate[]
    flatImages?: string[]
  }
  prompts: { question: string, answer: string }[]
}

interface SwipeProfileProps {
  profile: ProfileListing
  isTop: boolean
  cardIndex?: number
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeUp: () => void
}

// ── Flat Image Carousel ───────────────────────────────────────────────────────
function FlatImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx(i => (i - 1 + images.length) % images.length)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx(i => (i + 1) % images.length)
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-1" style={{ aspectRatio: '16/9' }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={images[idx]}
          alt={`Flat photo ${idx + 1}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="w-full h-full object-cover pointer-events-none select-none absolute inset-0"
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
          {images.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === idx
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all active:scale-95 cursor-pointer"
            aria-label="Previous flat photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all active:scale-95 cursor-pointer"
            aria-label="Next flat photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Photo count badge */}
      <div className="absolute top-2 right-2 z-20 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
        {idx + 1} / {images.length}
      </div>
    </div>
  )
}

export function SwipeProfile({ profile, isTop, cardIndex = 0, onSwipeLeft, onSwipeRight, onSwipeUp }: SwipeProfileProps) {
  const [showMatchDetails, setShowMatchDetails] = useState(false)
  const [selectedMate, setSelectedMate] = useState<Flatmate | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  // Framer Motion constraints and values
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotate = useTransform(x, [-300, 300], [-10, 10])
  const opacity = useTransform(x, [-400, -200, 0, 200, 400], [0.5, 1, 1, 1, 0.5])
  
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const rejectOpacity = useTransform(x, [0, -100], [0, 1])

  const dragControl = useAnimation()

  const snapBack = () =>
    dragControl.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 320, damping: 22 } })

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 120
    const velocityThreshold = 500

    const isFastSwipeLeft = info.velocity.x < -velocityThreshold
    const isFastSwipeRight = info.velocity.x > velocityThreshold
    const isFarLeft = info.offset.x < -swipeThreshold
    const isFarRight = info.offset.x > swipeThreshold
    const isFarUp = info.offset.y < -swipeThreshold

    if (isFarRight || isFastSwipeRight) {
      dragControl.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipeRight())
    } else if (isFarLeft || isFastSwipeLeft) {
      dragControl.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipeLeft())
    } else if (isFarUp) {
      dragControl.start({ y: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipeUp())
    } else {
      snapBack()
    }
  }

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 w-full h-full bg-[#111] rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/10"
      style={{
        x,
        y: isTop ? y : 0, 
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1, // Only top card fades on swipe, underlying stay visible until top removed
        scale: isTop ? 1 : Math.max(1 - cardIndex * 0.04, 0.8), // scale down underlying
        zIndex: isTop ? 10 : 10 - cardIndex,
        top: cardIndex * 12, // Stack downwards
        pointerEvents: isTop ? "auto" : "none"
      }}
      drag={isTop ? true : false}
      dragDirectionLock={false}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={dragControl}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
    >
      {/* Swipe Indicators */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-16 left-10 z-50 pointer-events-none transform -rotate-12 border-4 border-green-400 rounded-lg px-4 py-1">
        <span className="text-green-400 font-black text-4xl tracking-widest uppercase">Homey</span>
      </motion.div>
      <motion.div style={{ opacity: rejectOpacity }} className="absolute top-16 right-10 z-50 pointer-events-none transform rotate-12 border-4 border-red-400 rounded-lg px-4 py-1">
        <span className="text-red-400 font-black text-4xl tracking-widest uppercase">Pass</span>
      </motion.div>


      {/* Card Content - Scrollable horizontally or naturally? 
          Since we use horizontal drag on the WHOLE card, scrolling inside via overflow-y is tricky if touch action is hijacked.
          We can set the inner scroll area with `onPointerDownCapture` to stop drag propagation, 
          but usually Tinder cards are full images where you drag the whole thing, or scroll down.
          Framer Motion can allow scrolling if we only use `drag="x"`. We are using `drag="true"` (both).
          This works seamlessly on desktop, but on mobile `overflow-y` might conflict. Let's rely on standard scroll. */}
      <div 
        className="w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden"
        onPointerDown={(e) => {
          // If we drag in the scroll view, don't prevent drag but allow scrolling?
          // For now, we'll let Framer Motion handle it, user can drag the card anywhere.
        }}
      >
        {/* 1. HERO SECTION */}
        <div className="relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden">
          {/* Dark glass frame ring */}
          <div className="absolute inset-0 z-20 pointer-events-none rounded-t-[32px] sm:rounded-t-[40px]"
            style={{
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 40px rgba(0,0,0,0.4)"
            }}
          />
          <img 
            src={profile.images[currentImageIndex]} 
            alt={`${profile.name} - ${currentImageIndex + 1}`} 
            className="w-full h-full object-cover pointer-events-none select-none transition-opacity duration-300"
          />
          {/* Deeper multi-stop gradient for glassmorphic base */}
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.1) 55%, transparent 100%)"
            }}
          />


          {profile.images.length > 1 && (
            <>
               <div className="absolute top-3 left-0 right-0 z-20 flex gap-1 px-3 pointer-events-none">
                 {profile.images.map((_, i) => (
                   <div key={i} className={`h-1 flex-1 rounded-full shadow-sm transition-all duration-300 ${i === currentImageIndex ? 'bg-white' : 'bg-white/30 backdrop-blur-sm'}`} />
                 ))}
               </div>
               <button 
                 onPointerDown={(e) => e.stopPropagation()}
                 onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + profile.images.length) % profile.images.length) }}
                 className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all active:scale-95 cursor-pointer"
                 aria-label="Previous image"
               >
                 <ChevronLeft className="h-6 w-6" />
               </button>
               <button 
                 onPointerDown={(e) => e.stopPropagation()}
                 onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % profile.images.length) }}
                 className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all active:scale-95 cursor-pointer"
                 aria-label="Next image"
               >
                 <ChevronRight className="h-6 w-6" />
               </button>
            </>
          )}
          
          {/* 2. COMPATIBILITY BADGE */}
          {profile.matchScore && (
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setShowMatchDetails(!showMatchDetails)}
                className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 transition-all hover:bg-white/10"
              >
                <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                <span className="text-white text-xs font-bold">{profile.matchScore}% Match</span>
              </button>
              
              {showMatchDetails && (
                <div className="absolute top-10 right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-medium text-white/70">
                    <span>Sleep Match</span>
                    <span className="text-green-400">90%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-medium text-white/70">
                    <span>Cleanliness</span>
                    <span className="text-green-400">85%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-medium text-white/70">
                    <span>Social Vibe</span>
                    <span className="text-yellow-400">70%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-medium text-white/70">
                    <span>Guest Rules</span>
                    <span className="text-green-400">95%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hero Content Overlay — Dark Glassmorphic Panel */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.02), transparent)",
            }}
          >
            <div
              className="mx-3 mb-3 rounded-2xl px-5 py-4 flex flex-col gap-1.5"
              style={{
                background: "rgba(10, 10, 12, 0.72)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 0.5px rgba(255,255,255,0.04)"
              }}
            >
              <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                {profile.name}, {profile.age}
              </h1>
              <p className="text-white/70 text-xs md:text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-white/40" /> {profile.city}, {profile.area}
              </p>
              <p className="text-white/60 text-xs md:text-sm flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-white/40" /> {profile.occupation} {profile.collegeOrCompany && `at ${profile.collegeOrCompany}`}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.tags.map((tag, i) => (
                  <span key={i}
                    className="px-2.5 py-0.5 text-[10px] font-bold text-white/80 uppercase tracking-wider rounded-md"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE BODY */}
        <div className="px-6 py-6 pb-24 flex flex-col gap-8 bg-[#111]">

          {/* 7. USER INTENT */}
          {(() => {
            const intentCfg = {
              looking_room: {
                label: "Looking for a Private Room",
                emoji: "🔍",
                from: "from-cyan-500/20", to: "to-sky-500/10",
                border: "border-cyan-400/40",
                glow: "0 0 20px rgba(34,211,238,0.35), 0 0 40px rgba(34,211,238,0.15)",
                dot: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
                text: "text-cyan-300",
                badge: "bg-cyan-500/20 border-cyan-400/30",
                ring: "ring-cyan-400/20",
              },
              have_room: {
                label: "Has a Room — Needs a Roommate",
                emoji: "🏠",
                from: "from-indigo-500/20", to: "to-blue-500/10",
                border: "border-indigo-400/40",
                glow: "0 0 20px rgba(99,102,241,0.40), 0 0 40px rgba(99,102,241,0.18)",
                dot: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
                text: "text-indigo-200",
                badge: "bg-indigo-500/20 border-indigo-400/30",
                ring: "ring-indigo-400/20",
              },
              form_group: {
                label: "Building a New Flatmate Group",
                emoji: "👥",
                from: "from-violet-500/20", to: "to-purple-500/10",
                border: "border-violet-400/40",
                glow: "0 0 20px rgba(139,92,246,0.40), 0 0 40px rgba(139,92,246,0.18)",
                dot: "bg-violet-400 shadow-[0_0_8px_#a78bfa]",
                text: "text-violet-200",
                badge: "bg-violet-500/20 border-violet-400/30",
                ring: "ring-violet-400/20",
              },
            }[profile.intent]

            return (
              <div
                className={`relative p-4 rounded-2xl bg-gradient-to-r ${intentCfg.from} ${intentCfg.to} border ${intentCfg.border} ring-1 ${intentCfg.ring} flex items-center gap-4 overflow-hidden`}
                style={{ boxShadow: intentCfg.glow }}
              >
                {/* animated ambient glow blob */}
                <div className="absolute -inset-4 opacity-30 blur-2xl pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 30% 50%, ${intentCfg.glow.split("rgba")[1]?.split(")")[0].replace("(","rgba(") ?? "rgba(99,102,241,0.3)"} 0%, transparent 70%)` }}
                />

                {/* icon badge */}
                <div className={`relative shrink-0 h-11 w-11 rounded-xl border ${intentCfg.badge} flex items-center justify-center text-2xl`}>
                  {intentCfg.emoji}
                  {/* pulsing ring */}
                  <span className={`absolute inset-0 rounded-xl ring-2 ${intentCfg.ring} animate-ping opacity-60`} />
                </div>

                <div className="relative">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${intentCfg.text} opacity-70`}>Intent</p>
                  <p className={`text-base font-bold ${intentCfg.text}`}>{intentCfg.label}</p>
                </div>

                {/* glowing dot */}
                <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${intentCfg.dot} animate-pulse`} />
              </div>
            )
          })()}

          {/* 3. QUICK TRAITS & 5. LIFESTYLE SNAPSHOT */}
          <div>
            <h3 className="text-white text-lg font-bold mb-3 flex items-center gap-2">
              <Home className="h-4 w-4 text-white/50" />
              Lifestyle & Habits
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                 <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Sleep</p>
                 <p className="text-white text-sm font-semibold">{profile.traits.sleep}</p>
               </div>
               <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                 <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Cleanliness</p>
                 <p className="text-white text-sm font-semibold">{profile.traits.cleanliness}/5</p>
               </div>
               <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                 <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Social</p>
                 <p className="text-white text-sm font-semibold">{profile.traits.social}/5</p>
               </div>
               <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                 <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Guests</p>
                 <p className="text-white text-sm font-semibold">{profile.traits.guests}</p>
               </div>
            </div>
          </div>

          {/* 4. BIO SECTION */}
          <div>
             <h3 className="text-white text-lg font-bold mb-2">About {profile.name}</h3>
             <p className="text-white/70 text-sm leading-relaxed">
               {profile.bio}
             </p>
          </div>

          {/* 6. PRACTICAL DETAILS */}
          <div className="flex gap-3">
             <div className="flex-1 liquid-metallic-border rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
               <DollarSign className="h-6 w-6 text-green-400 mb-1" />
               <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Budget</p>
               <p className="text-white text-lg font-bold">₹{profile.budget.toLocaleString()}</p>
             </div>
             <div className="flex-1 liquid-metallic-border rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
               <MapPin className="h-6 w-6 text-orange-400 mb-1" />
               <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Move In</p>
               <p className="text-white text-lg font-bold">{profile.moveIn}</p>
             </div>
          </div>

          {/* 8. ROOM / FLAT PREVIEW (CONDITIONAL) */}
          {profile.intent === "have_room" && profile.flatDetails && (
            <div>
              <h3 className="text-white text-lg font-bold mb-3 flex items-center gap-2">
                <Home className="h-4 w-4 text-white/50" />
                The Flat
              </h3>

              {/* Flat Photo Carousel */}
              {profile.flatDetails.flatImages && profile.flatDetails.flatImages.length > 0 && (
                <FlatImageCarousel images={profile.flatDetails.flatImages} />
              )}

              <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-5 rounded-2xl border border-indigo-500/20 mb-4 relative overflow-hidden mt-3">
                {profile.groupMatchText ? (
                  <div className="bg-indigo-500/20 border border-indigo-400 p-3 rounded-xl mb-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span className="text-indigo-200 font-bold text-sm leading-tight">{profile.groupMatchText}</span>
                  </div>
                ) : profile.flatDetails.groupMatchScore ? (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                    {profile.flatDetails.groupMatchScore}% Group Match
                  </div>
                ) : null}
                <p className="text-indigo-200 font-bold mb-2 mt-1">{profile.flatDetails.type} • {profile.flatDetails.occupancy} Living • {profile.flatDetails.spots} spot available</p>
                <p className="text-white/60 text-xs mt-1">A beautiful fully furnished flat with balcony access, WiFi, and an attached washroom.</p>
              </div>

              {profile.flatDetails.flatmates.length > 0 && (
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Existing Flatmates</p>
                  <div className="flex gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
                    {profile.flatDetails.flatmates.map((mate, i) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedMate(mate)}
                        className="min-w-[140px] liquid-metallic-border rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-white/10 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        <div className="h-12 w-12 rounded-full bg-zinc-800 mb-2 overflow-hidden ring-2 ring-transparent group-hover:ring-white/10">
                          {/* Random avatar placeholder */}
                          <img src={`https://i.pravatar.cc/150?u=${mate.name}`} alt={mate.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-white text-sm font-bold">{mate.name}, {mate.age}</p>
                        <p className="text-white/50 text-[10px]">{mate.occupation}</p>
                        <div className="flex gap-1 mt-2">
                          {mate.traits.slice(0, 2).map((tr, idx) => (
                            <span key={idx} className="bg-white/10 text-white/80 text-[9px] px-1.5 py-0.5 rounded">
                              {tr}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. PROMPTS (HINGE STYLE) */}
          {profile.prompts.map((prompt, i) => (
            <div key={i} className="liquid-metallic-border rounded-2xl p-5 border border-white/10">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">{prompt.question}</p>
              <p className="text-white text-lg font-serif italic">"{prompt.answer}"</p>
            </div>
          ))}

          <div className="flex flex-col items-center justify-center text-white/20 text-xs mt-8 mb-4">
             <ChevronUp className="h-6 w-6 mb-1 opacity-40" />
             <span>Swipe up to browse next</span>
          </div>

        </div>
      </div>

      {/* Flatmate Modal */}
      <AnimatePresence>
        {selectedMate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            className="absolute inset-0 z-[100] flex flex-col justify-end p-4 bg-black/60 backdrop-blur-sm shadow-2xl"
          >
            <div className="bg-[#111] border border-white/10 rounded-[32px] p-6 pb-8 relative flex flex-col items-center flex-1 shadow-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden w-full max-w-sm mx-auto">
              <button 
                onClick={() => setSelectedMate(null)}
                className="absolute top-4 right-4 h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white sticky top-0 ml-auto z-10"
                style={{ float: 'right' }}
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="relative w-full flex flex-col items-center mt-2">
                {selectedMate.matchScore && (
                  <div className="absolute top-0 right-0 bg-green-500/20 border border-green-500 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                    {selectedMate.matchScore}% Match
                  </div>
                )}
                <div className="h-28 w-28 rounded-full bg-zinc-800 mb-4 overflow-hidden border-4 border-white/10 shadow-lg">
                  <img src={`https://i.pravatar.cc/150?u=${selectedMate.name}`} alt={selectedMate.name} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-white text-3xl font-black">{selectedMate.name}, {selectedMate.age}</h2>
                <p className="text-white/60 font-medium mb-6 flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> {selectedMate.occupation}
                </p>
              </div>
              
              <div className="w-full flex flex-col gap-6">
                {selectedMate.detailedTraits && (
                  <div>
                    <h3 className="text-white text-base font-bold mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4 text-white/50" /> Lifestyle & Habits
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                         <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Sleep</p>
                         <p className="text-white text-sm font-semibold">{selectedMate.detailedTraits.sleep}</p>
                       </div>
                       <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                         <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Cleanliness</p>
                         <p className="text-white text-sm font-semibold">{selectedMate.detailedTraits.cleanliness}/5</p>
                       </div>
                       <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                         <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Social</p>
                         <p className="text-white text-sm font-semibold">{selectedMate.detailedTraits.social}/5</p>
                       </div>
                       <div className="liquid-metallic-border p-3 rounded-xl border border-white/10">
                         <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Guests</p>
                         <p className="text-white text-sm font-semibold">{selectedMate.detailedTraits.guests}</p>
                       </div>
                    </div>
                  </div>
                )}

                {selectedMate.bio && (
                  <div>
                     <h3 className="text-white text-base font-bold mb-2">About {selectedMate.name}</h3>
                     <p className="text-white/70 text-sm leading-relaxed">{selectedMate.bio}</p>
                  </div>
                )}

                {selectedMate.budget && selectedMate.moveIn && (
                  <div className="flex gap-3">
                     <div className="flex-1 liquid-metallic-border rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                       <DollarSign className="h-6 w-6 text-green-400 mb-1" />
                       <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Budget</p>
                       <p className="text-white text-lg font-bold">₹{selectedMate.budget.toLocaleString()}</p>
                     </div>
                     <div className="flex-1 liquid-metallic-border rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                       <MapPin className="h-6 w-6 text-orange-400 mb-1" />
                       <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Move In</p>
                       <p className="text-white text-lg font-bold">{selectedMate.moveIn}</p>
                     </div>
                  </div>
                )}
                
                <div className="w-full liquid-metallic-border rounded-2xl p-5 border border-white/10">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-3 text-center">Vibe Check</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedMate.traits.map((tr, idx) => (
                      <span key={idx} className="bg-white/10 text-white/90 text-sm px-4 py-2 rounded-lg font-bold">
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedMate.prompts?.map((prompt, i) => (
                  <div key={i} className="liquid-metallic-border rounded-2xl p-5 border border-white/10">
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">{prompt.question}</p>
                    <p className="text-white text-base font-serif italic">"{prompt.answer}"</p>
                  </div>
                ))}
              </div>
              
              <div className="w-full mt-8 flex justify-center">
                <LiquidMetalButton label="Close Profile" onClick={() => setSelectedMate(null)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
