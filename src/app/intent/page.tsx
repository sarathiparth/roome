"use client"

import React from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Search, Crown, ChevronRight } from "lucide-react"

export default function IntentPage() {
  const router = useRouter()

  const choices = [
    {
      id: "have-room",
      icon: <Home className="h-8 w-8 text-amber-400" />,
      emoji: "🏠",
      label: "I have a room",
      sub: "Looking for flatmates to join",
      desc: "You'll set up your room details and find the right people to share with.",
      badge: "Room Owner",
      badgeColor: "bg-amber-400/15 text-amber-300 border-amber-400/30",
      route: "/room-setup",
      selected: "border-amber-400/70 bg-amber-400/[0.08] shadow-[0_0_32px_rgba(212,175,55,0.2)]",
    },
    {
      id: "find-room",
      icon: <Search className="h-8 w-8 text-blue-400" />,
      emoji: "🔍",
      label: "I want to find a room",
      sub: "Looking to join someone's place",
      desc: "Browse listings and match with room owners who fit your lifestyle.",
      badge: "Room Seeker",
      badgeColor: "bg-blue-400/15 text-blue-300 border-blue-400/30",
      route: "/accuracy",
      selected: "border-blue-400/70 bg-blue-400/[0.08] shadow-[0_0_32px_rgba(59,130,246,0.2)]",
    },
    {
      id: "later",
      icon: <Search className="h-8 w-8 text-emerald-400" />,
      emoji: "⏳",
      label: "Later find room",
      sub: "Just want to browse for now",
      desc: "Skip setup and explore — you can always come back and list your room later.",
      badge: "Explorer",
      badgeColor: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
      route: "/accuracy",
      selected: "border-emerald-400/70 bg-emerald-400/[0.08] shadow-[0_0_32px_rgba(52,211,153,0.2)]",
    },
  ]


  return (
    <main
      className="fixed inset-0 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: "linear-gradient(135deg, #0d0b00 0%, #0a0800 50%, #0d0900 100%)" }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.10) 0%, transparent 55%)" }} className="absolute inset-0" />
        <div style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(212,175,55,0.04) 0%, transparent 40%)" }} className="absolute inset-0" />
      </div>

      <div className="relative min-h-full flex flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-10 select-none">
            <div className="flex items-center">
              <div className="flex items-center justify-center bg-white rounded-full px-4 py-1.5">
                <span className="text-black font-semibold text-xl tracking-tight">roo</span>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight ml-1">me</span>
            </div>
          </div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <p className="text-xs uppercase tracking-widest font-medium text-amber-400">One last thing</p>
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <h1 className="text-white text-3xl font-semibold tracking-tight leading-tight">
              What are you<br />looking for?
            </h1>
            <p className="text-white/35 text-sm mt-3">
              Choose your role — this shapes your whole experience.
            </p>
          </motion.div>

          {/* Choices */}
          <div className="space-y-4">
            {choices.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(c.route)}
                className={cn(
                  "w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 group",
                  "border-white/10 bg-white/[0.03] backdrop-blur-xl",
                  "hover:border-amber-400/30 hover:bg-amber-400/[0.04]",
                  "hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]",
                )}
                onMouseEnter={(e) => {
                  e.currentTarget.classList.add(...c.selected.split(" "))
                  e.currentTarget.classList.remove("border-white/10", "bg-white/[0.03]")
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.classList.remove(...c.selected.split(" "))
                  e.currentTarget.classList.add("border-white/10", "bg-white/[0.03]")
                }}
              >
                <div className="flex items-start gap-5">
                  {/* Icon circle */}
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:border-amber-400/20 transition-all">
                    <span className="text-3xl">{c.emoji}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold text-base">{c.label}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", c.badgeColor)}>
                        {c.badge}
                      </span>
                    </div>
                    <p className="text-white/55 text-sm font-medium mb-2">{c.sub}</p>
                    <p className="text-white/30 text-xs leading-relaxed">{c.desc}</p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-amber-400/60 transition-colors mt-1 flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Divider note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/20 text-xs mt-8"
          >
            You can change this anytime in settings
          </motion.p>

        </div>
      </div>
    </main>
  )
}
