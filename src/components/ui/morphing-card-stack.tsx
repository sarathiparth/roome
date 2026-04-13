"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type LayoutMode = "stack" | "grid" | "list"

export interface CardData {
  id: string
  title: string
  description: string
  icon?: ReactNode
  color?: string
}

export interface MorphingCardStackProps {
  cards?: CardData[]
  className?: string
  defaultLayout?: LayoutMode
  onCardClick?: (card: CardData) => void
  /** Render cards with a premium dark-metallic chrome finish */
  metallic?: boolean
}

// ─── Metallic gradient presets cycle through cards ────────────────────────────
const METALLIC_GRADIENTS = [
  "linear-gradient(135deg, #1e1e2e 0%, #2d2d42 20%, #3a3a55 40%, #252538 60%, #1a1a2e 80%, #2a2a40 100%)",
  "linear-gradient(135deg, #1c2030 0%, #2a3045 20%, #1e2840 40%, #253048 60%, #1a2235 80%, #202840 100%)",
  "linear-gradient(135deg, #201824 0%, #321a30 20%, #281828 40%, #221620 60%, #1e1422 80%, #2a1a28 100%)",
]

const METALLIC_SHEEN =
  "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.07) 70%, transparent 100%)"

export function MorphingCardStack({
  cards = [],
  className,
  defaultLayout,
  onCardClick,
  metallic = false,
}: MorphingCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!cards || cards.length === 0) return null

  const card = cards[activeIndex]
  const gradientBg = METALLIC_GRADIENTS[activeIndex % METALLIC_GRADIENTS.length]

  const goNext = () => setActiveIndex((prev) => (prev + 1) % cards.length)
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)

  return (
    <div className={cn("space-y-3", className)}>
      {/* Card */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={() => onCardClick && onCardClick(card)}
            className="w-full rounded-2xl overflow-hidden cursor-pointer"
            style={
              metallic
                ? {
                    background: gradientBg,
                    border: "1px solid rgba(160,160,210,0.2)",
                    boxShadow:
                      "0 8px 32px rgba(0,0,0,0.7), 0 2px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.5) inset",
                  }
                : {
                    backgroundColor: card.color || "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            {/* Metallic sheen overlay */}
            {metallic && (
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: METALLIC_SHEEN }}
              />
            )}

            {/* Top edge highlight */}
            {metallic && (
              <div
                className="absolute top-0 inset-x-0 h-px rounded-t-2xl pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                }}
              />
            )}

            {/* Content */}
            <div className="relative p-5">
              {/* Icon + title row */}
              <div className="flex items-center gap-3 mb-3">
                {card.icon && (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={
                      metallic
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(80,80,120,0.6), rgba(50,50,90,0.8))",
                            border: "1px solid rgba(180,180,240,0.2)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                            color: "rgba(200,200,255,0.85)",
                          }
                        : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {card.icon}
                  </div>
                )}
                <h3
                  className="font-bold text-[15px] leading-snug"
                  style={
                    metallic
                      ? { color: "rgba(220,220,255,0.95)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }
                      : { color: "rgba(255,255,255,0.9)" }
                  }
                >
                  {card.title}
                </h3>
              </div>

              {/* Description */}
              <p
                className="text-[14px] leading-relaxed"
                style={
                  metallic
                    ? { color: "rgba(190,190,220,0.8)" }
                    : { color: "rgba(255,255,255,0.55)" }
                }
              >
                {card.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation — dots + arrows */}
      {cards.length > 1 && (
        <div className="flex items-center justify-between px-1">
          {/* Prev arrow */}
          <button
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90"
            style={
              metallic
                ? {
                    background: "linear-gradient(135deg, rgba(60,60,90,0.7), rgba(40,40,70,0.9))",
                    border: "1px solid rgba(160,160,220,0.15)",
                    color: "rgba(200,200,255,0.7)",
                  }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
            }
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={
                  index === activeIndex
                    ? metallic
                      ? {
                          width: 18,
                          background:
                            "linear-gradient(90deg, rgba(160,160,220,0.9), rgba(200,200,255,0.7))",
                          boxShadow: "0 0 6px rgba(160,160,220,0.5)",
                        }
                      : { width: 18, background: "rgba(255,255,255,0.7)" }
                    : metallic
                    ? { width: 6, background: "rgba(120,120,160,0.25)" }
                    : { width: 6, background: "rgba(255,255,255,0.15)" }
                }
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90"
            style={
              metallic
                ? {
                    background: "linear-gradient(135deg, rgba(60,60,90,0.7), rgba(40,40,70,0.9))",
                    border: "1px solid rgba(160,160,220,0.15)",
                    color: "rgba(200,200,255,0.7)",
                  }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
            }
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
