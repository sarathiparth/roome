"use client"

import React, { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Zap, Target, Eye } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Waves } from "@/components/ui/wave-background"

function AccuracyPageContent() {
  const router = useRouter()
  // Track hovered state in React so we can trigger intense liquid metal borders
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    // Inject keyframes for the rotating liquid metal border
    if (typeof document !== "undefined" && !document.getElementById("accuracy-liquid-style")) {
      const style = document.createElement("style")
      style.id = "accuracy-liquid-style"
      style.textContent = `
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-gradient {
          to { --angle: 360deg; }
        }
        .liquid-card::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 34px;
          background: conic-gradient(from var(--angle), transparent 0%, rgba(255,255,255,0.4) 15%, #fff 25%, rgba(255,255,255,0.4) 35%, transparent 50%, rgba(255,255,255,0.4) 65%, #fff 75%, rgba(255,255,255,0.4) 85%, transparent 100%);
          animation: spin-gradient 3s linear infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
           /* Permanently visible liquid metal border */
          opacity: 1;
          transition: filter 0.5s ease;
          pointer-events: none;
          z-index: 0;
          padding: 2px;
        }
        
        .liquid-card-quick::before { background: conic-gradient(from var(--angle), transparent 0%, rgba(168,85,247,0.4) 15%, #a855f7 25%, rgba(168,85,247,0.4) 35%, transparent 50%); }
        .liquid-card-accurate::before { background: conic-gradient(from var(--angle), transparent 0%, rgba(251,191,36,0.4) 15%, #fbbf24 25%, rgba(251,191,36,0.4) 35%, transparent 50%); }
        .liquid-card-explore::before { background: conic-gradient(from var(--angle), transparent 0%, rgba(255,255,255,0.2) 15%, #ffffff 25%, rgba(255,255,255,0.2) 35%, transparent 50%); }

        /* Make it slightly brighter on hover */
        .liquid-card:hover::before {
          filter: brightness(1.3);
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const handleModeSelect = (id: string) => {
    if (id === "quick" || id === "accurate") {
      router.push(`/vibe?mode=${id}`)
    } else {
      router.push("/profile")
    }
  }

  const modes = [
    {
      id: "quick",
      label: "Quick Search",
      subtitle: "10 Questions • Fast Match",
      description: "Answer a few quick questions to instantly find compatible roommates.",
      icon: <Zap className="h-10 w-10 text-white" strokeWidth={1.5} />,
      color: "rgba(139, 92, 246, 0.4)", // Electric purple/blue glow
      cardClass: "liquid-card-quick",
    },
    {
      id: "accurate",
      label: "Accurate Match",
      subtitle: "42 Questions • Deep Compatibility",
      description: "A detailed questionnaire for highly accurate roommate matching.",
      icon: <Target className="h-10 w-10 text-white" strokeWidth={1.5} />,
      color: "rgba(212, 175, 55, 0.5)", // Gold glow
      cardClass: "liquid-card-accurate",
    },
    {
      id: "explore",
      label: "Explore",
      subtitle: "Browse Freely",
      description: "View profiles like a spectator. Complete your profile to like and chat.",
      icon: <Eye className="h-10 w-10 text-white/70" strokeWidth={1.5} />,
      color: "rgba(255, 255, 255, 0.1)", // Minimal glow
      cardClass: "liquid-card-explore",
    },
  ]

  return (
    <main className="fixed inset-0 bg-[#060608] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* ── Waves background — identical to vibe check ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Waves
          className="absolute inset-0 opacity-60 mix-blend-screen"
          backgroundColor="transparent"
          strokeColor="rgba(255, 255, 255, 0.4)"
          pointerSize={0}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.04) 0%, transparent 60%)" }}
        />
      </div>

      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center p-5 py-8 md:p-6 md:py-20">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 md:mb-16 space-y-2 md:space-y-3"
        >
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white drop-shadow-md">
            How do you want to search?
          </h1>
          <p className="text-white/40 text-sm md:text-base max-w-sm mx-auto">
            Choose a mode to start finding your perfect roommate match.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl">
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleModeSelect(mode.id)}
              onMouseEnter={() => setHoveredId(mode.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "liquid-card",
                mode.cardClass,
                "group relative w-full flex flex-col items-start p-5 md:p-8 rounded-[24px] md:rounded-[32px] text-left overflow-hidden transition-all duration-500 will-change-transform",
                "bg-white/[0.02] border border-white/5 backdrop-blur-2xl",
                "focus:outline-none hover:scale-[1.03] hover:-translate-y-2 hover:bg-white/[0.06]"
              )}
            >
              {/* Dynamic hover glow injected below the card structure */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${mode.color} 0%, transparent 70%)` }}
              />

              {/* Icon Container */}
              <div className="relative mb-4 md:mb-8">
                <div className="h-12 w-12 md:h-20 md:w-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <div className="scale-[0.6] md:scale-100 flex items-center justify-center w-full h-full">
                    {mode.icon}
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="relative z-10 space-y-1.5 md:space-y-3 w-full">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-0.5 md:mb-1 group-hover:drop-shadow-md transition-all">
                    {mode.label}
                  </h3>
                  <p className={cn(
                    "text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                    mode.id === "quick" ? "text-white/40 group-hover:text-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" :
                    mode.id === "accurate" ? "text-white/40 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" :
                    "text-white/40 group-hover:text-white/80"
                  )}>
                    {mode.subtitle}
                  </p>
                </div>
                <p className="text-white/50 text-xs md:text-sm leading-relaxed max-w-[240px]">
                  {mode.description}
                </p>
              </div>

            </motion.button>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function AccuracyPage() {
  return (
    <Suspense fallback={<main className="fixed inset-0 bg-[#060608] flex items-center justify-center"><Sparkles className="h-8 w-8 text-white/10 animate-pulse" /></main>}>
      <AccuracyPageContent />
    </Suspense>
  )
}
