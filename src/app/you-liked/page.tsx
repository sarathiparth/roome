"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { PEOPLE, PersonExtended } from "@/app/explore/page"
import { NavigationBar } from "@/components/navigation-bar"
import { Sparkles, MapPin } from "lucide-react"

// Ensure color matches explore score function exactly
function getScoreColor(score: number) {
  if (score >= 90) return "#34d399"
  if (score >= 80) return "#fbbf24"
  return "#f87171"
}

export default function YouLikedPage() {
  // Use mock PEOPLE directly to simulate liked profiles
  const likedPeople = [...PEOPLE, ...PEOPLE].slice(0, 6);

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Dark phone column — max 430px, white page shows on sides on desktop */}
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">
        <NavigationBar />

        {/* Header */}
        <div className="sticky top-0 inset-x-0 z-30 px-5 pt-12 pb-4 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5">
          <h1 className="text-[28px] font-black text-white tracking-tight">You Liked</h1>
          <p className="text-white/50 text-[13px] mt-0.5">Profiles you swiped right on</p>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-2 gap-3">
            {likedPeople.map((person, i) => (
              <ProfileGridCard key={`${person.id}-${i}`} person={person} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

function ProfileGridCard({ person }: { person: PersonExtended }) {
  const router = useRouter()
  const color = getScoreColor(person.matchScore)

  return (
    <div 
      onClick={() => router.push(`/chat/${person.id}`)}
      className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#111] group cursor-pointer border border-white/10 shadow-lg"
    >
      <img
        src={person.images[0]}
        alt={person.name}
        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Dark fade on bottom for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.0) 60%)" }}
      />

      {/* Match pill — top right */}
      <div
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md border"
        style={{ background: "rgba(0,0,0,0.5)", borderColor: `${color}40` }}
      >
        <Sparkles className="h-2.5 w-2.5" style={{ color }} />
        <span className="text-[9px] font-black tracking-wider" style={{ color }}>{person.matchScore}%</span>
      </div>

      {/* Content — bottom aligned */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 pointer-events-none">
        <div className="flex items-baseline gap-1.5 drop-shadow-md">
          <h3 className="text-white font-black text-[15px] truncate leading-tight">{person.name.split(" ")[0]}</h3>
          <span className="text-white/70 font-light text-[13px]">{person.age}</span>
        </div>
        <div className="flex items-center gap-1 drop-shadow-sm truncate">
          <MapPin className="h-3 w-3 text-white/80 shrink-0" />
          <span className="text-white/80 text-[10px] font-medium truncate">{person.area}</span>
        </div>
      </div>
    </div>
  )
}
