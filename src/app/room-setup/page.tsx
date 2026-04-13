"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, ArrowRight, Check, Users, Home, IndianRupee,
  MapPin, Star, Plus, Trash2, Shield, Wifi, Wind, Dumbbell,
  ParkingCircle, ChefHat, Shirt, Crown, Camera,
  Search, Link2, UserCheck, Send, X, Clock
} from "lucide-react"
import { NavigationBar } from "@/components/navigation-bar"

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "flatmates" | "room-details" | "rules" | "done"
const STEPS: Step[] = ["flatmates", "room-details", "rules"]

type AddedFlatmate =
  | { type: "connected"; id: string; name: string; username: string; avatarSeed: string }
  | { type: "invited";   contact: string }

// ─── Amenity list ─────────────────────────────────────────────────────────────
const AMENITIES = [
  { id: "wifi",     label: "WiFi",        icon: <Wifi className="h-4 w-4" /> },
  { id: "ac",       label: "AC",          icon: <Wind className="h-4 w-4" /> },
  { id: "gym",      label: "Gym",         icon: <Dumbbell className="h-4 w-4" /> },
  { id: "parking",  label: "Parking",     icon: <ParkingCircle className="h-4 w-4" /> },
  { id: "kitchen",  label: "Kitchen",     icon: <ChefHat className="h-4 w-4" /> },
  { id: "laundry",  label: "Laundry",     icon: <Shirt className="h-4 w-4" /> },
  { id: "security", label: "Security",    icon: <Shield className="h-4 w-4" /> },
  { id: "cctv",     label: "CCTV",        icon: <Camera className="h-4 w-4" /> },
]

const ROOM_TYPES = [
  { id: "1bhk",  label: "1 BHK" },
  { id: "2bhk",  label: "2 BHK" },
  { id: "3bhk",  label: "3 BHK" },
  { id: "studio",label: "Studio" },
  { id: "pg",    label: "PG / Hostel" },
]

// ─── Golden style helpers ─────────────────────────────────────────────────────
const G = {
  text: "text-amber-400",
  border: "border-amber-400/20",
  borderSel: "border-amber-400/60",
  bg: "bg-amber-400/[0.06]",
  bgSel: "bg-amber-400/[0.12]",
  btn: "bg-amber-400 text-black hover:bg-amber-300 font-bold",
  input: cn(
    "w-full h-13 px-4 rounded-2xl border text-sm outline-none transition-all",
    "bg-white/[0.05] border-amber-400/20 text-white placeholder:text-white/25",
    "focus:border-amber-400/50 focus:bg-amber-400/[0.06] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.10)]"
  ),
}

// ─── Fake search results (simulates API) ─────────────────────────────────────
const FAKE_USERS = [
  { id: "u1", name: "Rahul Sharma",  username: "rahul.s",    avatarSeed: "rahul1" },
  { id: "u2", name: "Priya Nair",    username: "priya.nair", avatarSeed: "priya2" },
  { id: "u3", name: "Aman Gupta",    username: "amangu",     avatarSeed: "aman3"  },
  { id: "u4", name: "Sneha Pillai",  username: "sneha.p",    avatarSeed: "snehap" },
]

// ─── Yes/No Toggle ────────────────────────────────────────────────────────────
function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={cn(
            "flex-1 h-11 rounded-xl border-2 text-sm font-semibold transition-all",
            value === v
              ? "border-amber-400/60 bg-amber-400/12 text-amber-300"
              : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20"
          )}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoomSetupPage() {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)

  // Flatmates step
  const [flatmates, setFlatmates] = useState<AddedFlatmate[]>([])
  const [addMode, setAddMode] = useState<"connect" | "invite" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteContact, setInviteContact] = useState("")
  const [inviteSent, setInviteSent] = useState(false)

  const searchResults = searchQuery.trim().length > 1
    ? FAKE_USERS.filter(
        u =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase())
      ).filter(u => !flatmates.some(f => f.type === "connected" && f.id === u.id))
    : []

  const addConnectedFlatmate = (u: typeof FAKE_USERS[0]) => {
    setFlatmates(prev => [...prev, { type: "connected", ...u }])
    setSearchQuery("")
    setAddMode(null)
  }

  const sendInvite = () => {
    if (!inviteContact.trim()) return
    setFlatmates(prev => [...prev, { type: "invited", contact: inviteContact.trim() }])
    setInviteContact("")
    setInviteSent(true)
    setTimeout(() => { setInviteSent(false); setAddMode(null) }, 1500)
  }

  const removeFlatmate = (idx: number) =>
    setFlatmates(prev => prev.filter((_, i) => i !== idx))

  // Room details step
  const [location, setLocation] = useState("")
  const [rent, setRent] = useState(15000)
  const [roomType, setRoomType] = useState("")
  const [availableFrom, setAvailableFrom] = useState("")
  const [amenities, setAmenities] = useState<string[]>([])

  // Rules step
  const [smoking, setSmoking] = useState<boolean | null>(null)
  const [pets, setPets] = useState<boolean | null>(null)
  const [guests, setGuests] = useState<boolean | null>(null)

  const step = STEPS[stepIdx]
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  const canNext = () => {
    if (step === "flatmates") return true   // adding flatmates is optional
    if (step === "room-details") return !!(location.trim() && roomType && availableFrom)
    if (step === "rules") return smoking !== null && pets !== null && guests !== null
    return false
  }

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setDir(1); setStepIdx(s => s + 1)
    } else {
      router.push("/profile")
    }
  }

  const back = () => {
    if (stepIdx === 0) { router.back(); return }
    setDir(-1); setStepIdx(s => s - 1)
  }

  const toggleAmenity = (id: string) =>
    setAmenities(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32, filter: "blur(4px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32, filter: "blur(4px)" }),
  }

  const fmt = (n: number) => `₹${(n / 1000).toFixed(0)}K`

  return (
    <main
      className="fixed inset-0 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: "linear-gradient(135deg, #0d0b00 0%, #0a0800 50%, #0d0900 100%)" }}
    >
      <NavigationBar />
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ background: "radial-gradient(ellipse at 50% 15%, rgba(212,175,55,0.10) 0%, transparent 55%)" }} className="absolute inset-0" />
      </div>

      <div className="relative min-h-full flex flex-col items-center justify-center px-5 py-16 pb-32">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-8 select-none">
            <div className="flex items-center">
              <div className="flex items-center justify-center bg-white rounded-full px-4 py-1.5">
                <span className="text-black font-semibold text-xl tracking-tight">roo</span>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight ml-1">me</span>
            </div>
          </div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <p className={cn("text-xs uppercase tracking-widest font-medium", G.text)}>Room Setup</p>
              <Star className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Set up your room</h1>
            <p className="text-white/35 text-sm mt-1">Step {stepIdx + 1} of {STEPS.length}</p>
          </motion.div>

          {/* Progress */}
          <div className="h-1 rounded-full mb-8 overflow-hidden bg-amber-400/15">
            <motion.div className="h-full rounded-full bg-amber-400" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>

          {/* Content */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 0.68, 0, 1] }}
              className="space-y-4"
            >

              {/* ── Step 1: Flatmates ── */}
              {step === "flatmates" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2.5 rounded-xl border", G.bg, G.border)}>
                      <Users className={cn("h-5 w-5", G.text)} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Add existing flatmates</p>
                      <p className="text-white/35 text-xs">Connect their Roomi profiles or send an invite</p>
                    </div>
                  </div>

                  {/* Added flatmates */}
                  {flatmates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-3"
                    >
                      {flatmates.map((fm, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative flex flex-col items-center gap-1.5"
                        >
                          {fm.type === "connected" ? (
                            <>
                              <div className="relative h-14 w-14">
                                <img
                                  src={`https://i.pravatar.cc/80?u=${fm.avatarSeed}`}
                                  alt={fm.name}
                                  className="h-14 w-14 rounded-full object-cover ring-2 ring-amber-400/40"
                                />
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-[#0d0b00] flex items-center justify-center">
                                  <UserCheck className="h-2.5 w-2.5 text-white" />
                                </div>
                              </div>
                              <p className="text-white/70 text-[10px] font-medium max-w-[56px] truncate text-center">{fm.name.split(" ")[0]}</p>
                            </>
                          ) : (
                            <>
                              <div className="h-14 w-14 rounded-full bg-white/5 border-2 border-amber-400/20 border-dashed flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-400/50" />
                              </div>
                              <p className="text-amber-400/60 text-[10px] font-medium max-w-[56px] truncate text-center">Invited</p>
                            </>
                          )}
                          <button
                            onClick={() => removeFlatmate(idx)}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-all"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Two paths */}
                  <AnimatePresence mode="wait">
                    {addMode === null && (
                      <motion.div
                        key="pick"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        {/* Path A: Connect Roomi Profile */}
                        <button
                          onClick={() => setAddMode("connect")}
                          className={cn(
                            "flex flex-col items-start gap-3 p-4 rounded-2xl border-2 border-dashed",
                            "border-amber-400/25 bg-amber-400/[0.04]",
                            "hover:border-amber-400/50 hover:bg-amber-400/[0.08] transition-all group"
                          )}
                        >
                          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 group-hover:bg-amber-400/15 transition-all">
                            <Search className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-white text-sm font-semibold leading-snug">Connect Roomi Profile</p>
                            <p className="text-white/35 text-[11px] mt-0.5">Search by name or @handle</p>
                          </div>
                        </button>

                        {/* Path B: Invite via Link */}
                        <button
                          onClick={() => setAddMode("invite")}
                          className={cn(
                            "flex flex-col items-start gap-3 p-4 rounded-2xl border-2 border-dashed",
                            "border-blue-400/25 bg-blue-400/[0.04]",
                            "hover:border-blue-400/50 hover:bg-blue-400/[0.08] transition-all group"
                          )}
                        >
                          <div className="p-2 rounded-xl bg-blue-400/10 border border-blue-400/20 group-hover:bg-blue-400/15 transition-all">
                            <Link2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-white text-sm font-semibold leading-snug">Invite via Link</p>
                            <p className="text-white/35 text-[11px] mt-0.5">Flatmate not on Roomi yet</p>
                          </div>
                        </button>
                      </motion.div>
                    )}

                    {/* Connect mode */}
                    {addMode === "connect" && (
                      <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setAddMode(null); setSearchQuery("") }}
                            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <p className={cn("text-xs font-bold uppercase tracking-wider", G.text)}>Search Roomi Users</p>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/40 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Name or @username…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={cn(G.input, "pl-10")}
                            autoFocus
                          />
                        </div>

                        {/* Results */}
                        <AnimatePresence>
                          {searchResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-2xl border border-amber-400/15 bg-white/[0.03] overflow-hidden divide-y divide-white/5"
                            >
                              {searchResults.map(user => (
                                <button
                                  key={user.id}
                                  onClick={() => addConnectedFlatmate(user)}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-amber-400/[0.06] transition-all text-left group"
                                >
                                  <img
                                    src={`https://i.pravatar.cc/60?u=${user.avatarSeed}`}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover ring-1 ring-amber-400/20"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                                    <p className="text-white/40 text-xs">@{user.username}</p>
                                  </div>
                                  <div className="h-8 w-8 rounded-full border border-amber-400/30 bg-amber-400/10 flex items-center justify-center group-hover:bg-amber-400/20 transition-all">
                                    <Plus className="h-4 w-4 text-amber-400" />
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                          {searchQuery.trim().length > 1 && searchResults.length === 0 && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-white/30 text-xs text-center py-4"
                            >
                              No results — try inviting them instead
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Invite mode */}
                    {addMode === "invite" && (
                      <motion.div
                        key="invite"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setAddMode(null); setInviteContact(""); setInviteSent(false) }}
                            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Invite Flatmate</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-400/15 text-blue-200/60 text-xs leading-relaxed">
                          <span className="text-blue-300 font-semibold">How it works: </span>
                          Your flatmate will get a link to create their Roomi account. Once they sign up, they'll automatically appear linked to your listing.
                        </div>

                        <div className="relative">
                          <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/40 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Phone number or email"
                            value={inviteContact}
                            onChange={e => setInviteContact(e.target.value)}
                            className={cn(
                              "w-full h-13 px-4 pl-10 rounded-2xl border text-sm outline-none transition-all",
                              "bg-white/[0.05] border-blue-400/20 text-white placeholder:text-white/25",
                              "focus:border-blue-400/50 focus:bg-blue-400/[0.04] focus:shadow-[0_0_0_3px_rgba(96,165,250,0.10)]"
                            )}
                            autoFocus
                          />
                        </div>

                        <button
                          onClick={sendInvite}
                          disabled={!inviteContact.trim() || inviteSent}
                          className={cn(
                            "w-full h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                            inviteSent
                              ? "bg-green-500/20 border border-green-400/30 text-green-400"
                              : inviteContact.trim()
                              ? "bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30"
                              : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                          )}
                        >
                          {inviteSent ? (
                            <><Check className="h-4 w-4" /> Invite Sent!</>
                          ) : (
                            <><Send className="h-4 w-4" /> Send Invite Link</>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Skip note */}
                  {flatmates.length === 0 && addMode === null && (
                    <p className="text-white/20 text-xs text-center pt-1">
                      Optional — you can add flatmates anytime from your profile
                    </p>
                  )}
                </div>
              )}

              {/* ── Step 2: Room Details ── */}
              {step === "room-details" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn("p-2.5 rounded-xl border", G.bg, G.border)}>
                      <Home className={cn("h-5 w-5", G.text)} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Room details</p>
                      <p className="text-white/35 text-xs">Tell people about your place</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className={cn("text-xs font-medium uppercase tracking-wider mb-2 block", G.text)}>
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/40 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. Koramangala, Bangalore"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={cn(G.input, "pl-10")}
                      />
                    </div>
                  </div>

                  {/* Rent */}
                  <div>
                    <label className={cn("text-xs font-medium uppercase tracking-wider mb-2 flex items-center justify-between", G.text)}>
                      <span>Monthly Rent *</span>
                      <span className="text-amber-300 text-base font-black normal-case tracking-normal">₹{rent.toLocaleString("en-IN")}</span>
                    </label>
                    <div className="relative h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: "linear-gradient(90deg,rgba(212,175,55,0.5),rgba(212,175,55,0.9))" }}
                        animate={{ width: `${((rent - 3000) / (80000 - 3000)) * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                      />
                      <input
                        type="range" min={3000} max={80000} step={1000}
                        value={rent}
                        onChange={(e) => setRent(+e.target.value)}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[8000, 12000, 18000, 25000, 35000, 50000].map((v) => (
                        <button
                          key={v}
                          onClick={() => setRent(v)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            rent === v
                              ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                              : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                          )}
                        >{fmt(v)}</button>
                      ))}
                    </div>
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className={cn("text-xs font-medium uppercase tracking-wider mb-2 block", G.text)}>Room Type *</label>
                    <div className="flex flex-wrap gap-2">
                      {ROOM_TYPES.map((rt) => (
                        <button
                          key={rt.id}
                          onClick={() => setRoomType(rt.id)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                            roomType === rt.id
                              ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                              : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                          )}
                        >{rt.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Available From */}
                  <div>
                    <label className={cn("text-xs font-medium uppercase tracking-wider mb-2 block", G.text)}>Available From *</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "now",      label: "Right Now" },
                        { id: "2weeks",   label: "2 Weeks" },
                        { id: "1month",   label: "1 Month" },
                        { id: "flexible", label: "Flexible" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAvailableFrom(opt.id)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                            availableFrom === opt.id
                              ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                              : "border-white/10 text-white/40 hover:border-white/20"
                          )}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className={cn("text-xs font-medium uppercase tracking-wider mb-2 block", G.text)}>Amenities <span className="text-white/25 normal-case tracking-normal text-[10px]">optional</span></label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map((am) => {
                        const sel = amenities.includes(am.id)
                        return (
                          <button
                            key={am.id}
                            onClick={() => toggleAmenity(am.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                              sel
                                ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                                : "border-white/10 text-white/40 hover:border-white/20"
                            )}
                          >
                            {am.icon} {am.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: House Rules ── */}
              {step === "rules" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn("p-2.5 rounded-xl border", G.bg, G.border)}>
                      <Shield className={cn("h-5 w-5", G.text)} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">House rules</p>
                      <p className="text-white/35 text-xs">Set expectations for your flatmates</p>
                    </div>
                  </div>

                  {[
                    { label: "🚬  Smoking allowed?",       value: smoking, set: setSmoking },
                    { label: "🐾  Pets allowed?",          value: pets,    set: setPets },
                    { label: "🚪  Guests / visitors OK?",  value: guests,  set: setGuests },
                  ].map((rule, i) => (
                    <motion.div
                      key={rule.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        rule.value !== null
                          ? "border-amber-400/30 bg-amber-400/[0.05]"
                          : "border-white/10 bg-white/[0.03]"
                      )}
                    >
                      <p className="text-white/80 text-sm font-medium mb-3">{rule.label}</p>
                      <YesNo value={rule.value} onChange={(v) => rule.set(v)} />
                    </motion.div>
                  ))}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={back}
              className="h-13 w-13 flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:border-white/20 transition-all flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              disabled={!canNext()}
              className={cn(
                "flex-1 h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300",
                canNext()
                  ? "bg-amber-400 text-black hover:bg-amber-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  : "bg-white/8 text-white/25 cursor-not-allowed"
              )}
            >
              {stepIdx === STEPS.length - 1 ? (
                <><Crown className="h-4 w-4" /> Save & Finish</>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}
