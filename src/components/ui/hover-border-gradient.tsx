'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: unknown[]) { return twMerge(clsx(inputs)) }

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'

const movingMap: Record<Direction, string> = {
  TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  RIGHT: 'radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
}

const highlight =
  'radial-gradient(75% 181.15942028985506% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)'

// ── Original pill/button variant ────────────────────────────────────────────
export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Element = 'button',
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<{
  as?: React.ElementType
  containerClassName?: string
  className?: string
  duration?: number
  clockwise?: boolean
} & React.HTMLAttributes<HTMLElement>>) {
  const [hovered, setHovered] = useState(false)
  const [direction, setDirection] = useState<Direction>('BOTTOM')

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']
    const currentIndex = directions.indexOf(currentDirection)
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length
    return directions[nextIndex]
  }

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(
        () => setDirection((prev) => rotateDirection(prev)),
        duration * 1000,
      )
      return () => clearInterval(interval)
    }
  }, [hovered])

  return (
    <Element
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-full border bg-black/40 box-decoration-clone p-px backdrop-blur-sm transition duration-500 hover:bg-black/60',
        containerClassName,
      )}
      {...props}
    >
      <div className={cn('z-10 w-auto rounded-[inherit] bg-black px-4 py-2 text-white', className)}>
        {children}
      </div>
      <motion.div
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{ filter: 'blur(2px)', position: 'absolute', width: '100%', height: '100%' }}
        initial={{ background: movingMap[direction] }}
        animate={{ background: hovered ? [movingMap[direction], highlight] : movingMap[direction] }}
        transition={{ ease: 'linear', duration: duration ?? 1 }}
      />
      <div className="absolute inset-0.5 z-1 flex-none rounded-[100px] bg-black" />
    </Element>
  )
}

// ── Card variant — rotating animated border for rectangular profile cards ────
// Wraps card content. The 1px gap between outer container and m-[1px] inner
// div reveals the blurred rotating gradient = animated border effect.
export function HoverBorderCard({
  children,
  containerClassName,
  duration = 3,
  clockwise = true,
}: {
  children: React.ReactNode
  containerClassName?: string
  duration?: number
  clockwise?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [direction, setDirection] = useState<Direction>('TOP')

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']
    const currentIndex = directions.indexOf(currentDirection)
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length
    return directions[nextIndex]
  }

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(
        () => setDirection((prev) => rotateDirection(prev)),
        duration * 1000,
      )
      return () => clearInterval(interval)
    }
  }, [hovered])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn('relative w-full rounded-2xl', containerClassName)}
    >
      {/* Animated gradient — shows at the 1px gap as the border */}
      <motion.div
        className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none"
        style={{ filter: 'blur(2px)' }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered ? [movingMap[direction], highlight] : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration }}
      />
      {/* 1px inset inner wrapper — clips content and reveals gradient border */}
      <div className="relative z-10 m-[1px] rounded-[inherit] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// ── Demo ─────────────────────────────────────────────────────────────────────
export default function HoverBorderDemo() {
  return (
    <HoverBorderGradient>
      <span>Roomi Components</span>
    </HoverBorderGradient>
  )
}
