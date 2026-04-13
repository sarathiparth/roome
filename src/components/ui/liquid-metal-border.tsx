"use client";

/**
 * LiquidMetalBorder
 * ------------------
 * Drop-in wrapper that renders the animated conic-gradient border
 * (same shader-quality visual as BorderRotate) around arbitrary children.
 *
 * Usage:
 *   <LiquidMetalBorder>
 *     <YourCard />
 *   </LiquidMetalBorder>
 *
 * Props mirror BorderRotate:
 *   - animationMode   'auto-rotate' | 'rotate-on-hover' | 'stop-rotate-on-hover'
 *   - animationSpeed  seconds (default 6)
 *   - borderWidth     px (default 1)
 *   - borderRadius    px (default 20) – pass 9999 for pill
 *   - active          boolean – when false the border is off (transparent)
 *   - className       extra classes on the outer wrapper div
 */

import React, { type CSSProperties, type ReactNode, type HTMLAttributes } from "react";

type AnimationMode = "auto-rotate" | "rotate-on-hover" | "stop-rotate-on-hover";

interface LiquidMetalBorderProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  children: ReactNode;
  className?: string;
  animationMode?: AnimationMode;
  animationSpeed?: number;
  borderWidth?: number;
  borderRadius?: number;
  /** When false the border is rendered as a simple transparent 1px border  */
  active?: boolean;
  style?: CSSProperties;
}

// Matte-black liquid metal palette – identical to your existing BorderRotate defaults
const PRIMARY   = "#0a0a0a";
const SECONDARY = "#2a2a2a";
const ACCENT    = "#ffffff";
const BG        = "rgba(0,0,0,0)"; // transparent so children bg shows through

const modeClass: Record<AnimationMode, string> = {
  "auto-rotate":           "gradient-border-auto",
  "rotate-on-hover":       "gradient-border-hover",
  "stop-rotate-on-hover":  "gradient-border-stop-hover",
};

export function LiquidMetalBorder({
  children,
  className = "",
  animationMode = "auto-rotate",
  animationSpeed = 6,
  borderWidth = 1,
  borderRadius = 20,
  active = true,
  style = {},
  ...props
}: LiquidMetalBorderProps) {
  const borderStyle: CSSProperties = active
    ? {
        "--gradient-primary":   PRIMARY,
        "--gradient-secondary": SECONDARY,
        "--gradient-accent":    ACCENT,
        "--animation-duration": `${animationSpeed}s`,
        border:            `${borderWidth}px solid transparent`,
        borderRadius:      `${borderRadius}px`,
        backgroundImage: `
          linear-gradient(${BG}, ${BG}),
          conic-gradient(
            from var(--gradient-angle, 0deg),
            ${PRIMARY}   0%,
            ${SECONDARY} 37%,
            ${ACCENT}    30%,
            ${SECONDARY} 33%,
            ${PRIMARY}   40%,
            ${PRIMARY}   50%,
            ${SECONDARY} 77%,
            ${ACCENT}    80%,
            ${SECONDARY} 83%,
            ${PRIMARY}   90%
          )
        `,
        backgroundClip:   "padding-box, border-box",
        backgroundOrigin: "padding-box, border-box",
        ...style,
      } as CSSProperties
    : {
        border:       `${borderWidth}px solid transparent`,
        borderRadius: `${borderRadius}px`,
        ...style,
      };

  return (
    <div
      className={`gradient-border-component ${active ? modeClass[animationMode] : ""} ${className}`}
      style={borderStyle}
      {...props}
    >
      {children}
    </div>
  );
}
