"use client"

import React from "react"
import { motion } from "motion/react"

interface RadarChartProps {
  scores: {
    sleep: number
    clean: number
    finance: number
    social: number
    conflict: number
    culture: number
  }
  size?: number
  animated?: boolean
}

const LABELS: { key: keyof RadarChartProps["scores"]; label: string; emoji: string; color: string }[] = [
  { key: "sleep", label: "Sleep", emoji: "🌙", color: "#818cf8" },
  { key: "clean", label: "Clean", emoji: "✨", color: "#34d399" },
  { key: "finance", label: "Finance", emoji: "💰", color: "#fbbf24" },
  { key: "social", label: "Social", emoji: "👥", color: "#f472b6" },
  { key: "conflict", label: "Conflict", emoji: "🤝", color: "#60a5fa" },
  { key: "culture", label: "Culture", emoji: "🌍", color: "#c084fc" },
]

/**
 * "Why We Match" Radar Chart
 * 
 * Renders a hexagonal radar chart showing compatibility breakdown
 * across 6 dimensions. Uses pure SVG for maximum performance.
 */
export function CompatibilityRadar({ scores, size = 200, animated = true }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 30
  const n = LABELS.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // Start from top

  // Generate polygon points for a given set of values (0-100)
  function polygonPoints(values: number[]): string {
    return values
      .map((v, i) => {
        const angle = startAngle + i * angleStep
        const r = (v / 100) * maxR
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
      })
      .join(" ")
  }

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [25, 50, 75, 100]
  const values = LABELS.map((l) => scores[l.key])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {rings.map((pct) => (
          <polygon
            key={pct}
            points={polygonPoints(Array(n).fill(pct))}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const angle = startAngle + i * angleStep
          const x2 = cx + maxR * Math.cos(angle)
          const y2 = cy + maxR * Math.sin(angle)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          )
        })}

        {/* Filled area */}
        {animated ? (
          <motion.polygon
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            points={polygonPoints(values)}
            fill="rgba(52,211,153,0.15)"
            stroke="rgba(52,211,153,0.6)"
            strokeWidth={2}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ) : (
          <polygon
            points={polygonPoints(values)}
            fill="rgba(52,211,153,0.15)"
            stroke="rgba(52,211,153,0.6)"
            strokeWidth={2}
          />
        )}

        {/* Data points */}
        {values.map((v, i) => {
          const angle = startAngle + i * angleStep
          const r = (v / 100) * maxR
          const x = cx + r * Math.cos(angle)
          const y = cy + r * Math.sin(angle)
          return (
            <motion.circle
              key={i}
              initial={animated ? { opacity: 0, r: 0 } : undefined}
              animate={{ opacity: 1, r: 3.5 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              cx={x}
              cy={y}
              fill={LABELS[i].color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
            />
          )
        })}
      </svg>

      {/* Labels outside the chart */}
      {LABELS.map((l, i) => {
        const angle = startAngle + i * angleStep
        const labelR = maxR + 20
        const x = cx + labelR * Math.cos(angle)
        const y = cy + labelR * Math.sin(angle)

        return (
          <div
            key={l.key}
            className="absolute flex flex-col items-center"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-[11px]">{l.emoji}</span>
            <span className="text-[8px] text-white/50 font-semibold mt-0.5">{scores[l.key]}%</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * "Why We Match" Card — shows radar chart + section breakdown
 */
export function WhyWeMatchCard({ scores, matchPct }: { scores: RadarChartProps["scores"]; matchPct: number }) {
  const scoreColor = matchPct >= 90 ? "#34d399" : matchPct >= 80 ? "#818cf8" : matchPct >= 60 ? "#fbbf24" : "#f87171"

  return (
    <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Why We Match</h3>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
          style={{ borderColor: `${scoreColor}40`, background: `${scoreColor}10` }}
        >
          <span className="text-[11px] font-black" style={{ color: scoreColor }}>
            {matchPct}%
          </span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center py-2">
        <CompatibilityRadar scores={scores} size={180} />
      </div>

      {/* Section breakdown bars */}
      <div className="space-y-2.5">
        {LABELS.map((l) => (
          <div key={l.key} className="flex items-center gap-3">
            <span className="text-sm w-5 text-center">{l.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60 text-[10px] font-semibold">{l.label}</span>
                <span className="text-white/40 text-[10px] font-medium">{scores[l.key]}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scores[l.key]}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: l.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
