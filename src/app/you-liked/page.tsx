"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NavigationBar } from "@/components/navigation-bar"
import { MapPin, Heart, Loader2 } from "lucide-react"
import { motion } from "motion/react"

interface LikedProfile {
  id: string
  fullName: string | null
  avatarUrl: string | null
  city: string | null
  direction: string
  swipedId: string
  swiped: {
    id: string
    fullName: string | null
    avatarUrl: string | null
    city: string | null
    occupation: string | null
  }
}

export default function YouLikedPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // TODO: Wire up dedicated getYouLikedProfiles server action
      setProfiles([])
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
          <h1 className="text-[28px] font-black text-white tracking-tight">You Liked</h1>
          <p className="text-white/50 text-[13px] mt-0.5">Profiles you swiped right on</p>
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
                <p className="text-white/40 text-xs">Profiles you swipe right on will appear here</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {profiles.map((person: any, i: number) => (
                <ProfileGridCard key={`${person.id}-${i}`} person={person} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function ProfileGridCard({ person }: { person: any }) {
  const router = useRouter()
  const profile = person.swiped || person
  const avatarUrl = profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.fullName || "?")}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => router.push("/explore")}
      className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#111] group cursor-pointer border border-white/10 shadow-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={profile.fullName || ""}
        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.0) 60%)" }}
      />

      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 pointer-events-none">
        <div className="flex items-baseline gap-1.5 drop-shadow-md">
          <h3 className="text-white font-black text-[15px] truncate leading-tight">
            {profile.fullName?.split(" ")[0] ?? "Unknown"}
          </h3>
        </div>
        {profile.city && (
          <div className="flex items-center gap-1 drop-shadow-sm truncate">
            <MapPin className="h-3 w-3 text-white/80 shrink-0" />
            <span className="text-white/80 text-[10px] font-medium truncate">{profile.city}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
