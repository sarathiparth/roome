"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NavigationBar } from "@/components/navigation-bar"
import { Sparkles, MapPin, Heart, Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { getLikedYouProfiles } from "@/app/explore/actions"

function getScoreColor(score: number) {
  if (score >= 90) return "#34d399"
  if (score >= 80) return "#fbbf24"
  return "#f87171"
}

interface LikedProfile {
  id: string
  fullName: string | null
  avatarUrl: string | null
  city: string | null
  occupation: string | null
  bio: string | null
  swipeDirection: string
  swipedAt: Date
}

export default function LikedYouPage() {
  const [profiles, setProfiles] = useState<LikedProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getLikedYouProfiles()
      setProfiles(result.profiles as unknown as LikedProfile[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">
        <NavigationBar />

        {/* Header */}
        <div className="sticky top-0 inset-x-0 z-30 px-5 pt-12 pb-4 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5">
          <h1 className="text-[28px] font-black text-white tracking-tight">Liked You</h1>
          <p className="text-white/50 text-[13px] mt-0.5">
            {profiles.length > 0
              ? `${profiles.length} people liked your profile`
              : "People who liked you will appear here"}
          </p>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="h-8 w-8 text-white/30" />
              </motion.div>
            </div>
          ) : profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-4 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Heart className="h-7 w-7 text-white/20" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">No likes yet</h2>
                <p className="text-white/40 text-xs">Keep exploring — your perfect roommate is out there!</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {profiles.map((person, i) => (
                <ProfileGridCard key={`${person.id}-${i}`} person={person} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function ProfileGridCard({ person }: { person: LikedProfile }) {
  const router = useRouter()
  const isSuperLike = person.swipeDirection === "super"
  const avatarUrl = person.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(person.fullName || "?")}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 }}
      onClick={() => router.push("/explore")}
      className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#111] group cursor-pointer border border-white/10 shadow-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={person.fullName || ""}
        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.0) 60%)" }}
      />

      {isSuperLike && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md border"
          style={{ background: "rgba(0,0,0,0.5)", borderColor: "#818cf840" }}
        >
          <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
          <span className="text-[9px] font-black tracking-wider text-indigo-400">SUPER</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 pointer-events-none">
        <div className="flex items-baseline gap-1.5 drop-shadow-md">
          <h3 className="text-white font-black text-[15px] truncate leading-tight">
            {person.fullName?.split(" ")[0] ?? "Unknown"}
          </h3>
        </div>
        {person.city && (
          <div className="flex items-center gap-1 drop-shadow-sm truncate">
            <MapPin className="h-3 w-3 text-white/80 shrink-0" />
            <span className="text-white/80 text-[10px] font-medium truncate">{person.city}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
