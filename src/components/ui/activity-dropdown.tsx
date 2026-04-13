"use client"

import type React from "react"
import { useState } from "react"
import { ChevronUp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownItem {
  id: number
  icon: React.ReactNode
  title: string
  description?: string
  meta?: string
}

interface ActivityDropdownProps {
  /** Icon shown in the header */
  headerIcon: React.ReactNode
  /** Bold title in the header */
  title: string
  /** Subtitle shown only when collapsed */
  subtitle?: string
  /** List of items */
  items: DropdownItem[]
  /** Start open */
  defaultOpen?: boolean
  className?: string
}

export function ActivityDropdown({
  headerIcon,
  title,
  subtitle,
  items,
  defaultOpen = false,
  className,
}: ActivityDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        "w-full overflow-hidden cursor-pointer select-none",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isOpen ? "rounded-[24px]" : "rounded-[20px]",
        className,
      )}
      style={{
        background: "rgba(255,255,255,0.025)",
      }}
      onClick={() => setIsOpen(v => !v)}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3.5 px-5 py-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-colors duration-300"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="text-white/60">{headerIcon}</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p
            className={cn(
              "text-xs text-white/40 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isOpen ? "opacity-0 max-h-0 mt-0" : "opacity-100 max-h-5 mt-0.5",
            )}
          >
            {subtitle ?? `${items.length} items`}
          </p>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <ChevronUp
            className={cn(
              "h-4 w-4 text-white/30 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isOpen ? "rotate-0" : "rotate-180",
            )}
          />
        </div>
      </div>

      {/* ── Expandable list ── */}
      <div
        className={cn(
          "grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {/* Thin divider */}
          <div className="mx-5 mb-3 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

          <div className="px-3 pb-3 space-y-1">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] px-3 py-3",
                  "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 60}ms` : "0ms",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onClick={e => e.stopPropagation()} // prevent re-toggling
              >
                {/* Icon */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-white/55">{item.icon}</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-semibold text-white/85">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-white/40 truncate mt-0.5">{item.description}</p>
                  )}
                </div>

                {/* Meta / time */}
                {item.meta && (
                  <span className="text-[10px] text-white/30 shrink-0">{item.meta}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
