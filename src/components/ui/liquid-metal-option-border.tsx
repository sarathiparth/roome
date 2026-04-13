"use client";

/**
 * LiquidMetalOptionBorder
 * ─────────────────────────────────────────────────────────────────
 * Pure CSS animated conic-gradient border — zero WebGL, zero flicker.
 *
 * The previous WebGL ShaderMount approach caused blinking because:
 *  1. Mounting a WebGL canvas takes 1-2 frames → visible black flash
 *  2. Multiple options on screen exhaust browser WebGL context limits
 *  3. Destroy/remount cycle on every selection click = guaranteed blink
 *
 * This version uses a rotating conic-gradient on a ::before pseudo-element
 * injected via a <style> tag. The border is ALWAYS present (opacity only),
 * so toggling active=true just fades it in — no layout shift, no GPU init.
 */

import { useEffect, useId } from "react";
import type { CSSProperties, ReactNode } from "react";

interface LiquidMetalOptionBorderProps {
  children: ReactNode;
  active?: boolean;
  borderWidth?: number;
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
  /** Unused — kept for API compatibility */
  colorFilter?: string;
}

// Inject the keyframe animation once
const STYLE_ID = "lmob-css-style-v3";
function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = `
    @keyframes lmob-spin {
      from { --lmob-angle: 0deg; }
      to   { --lmob-angle: 360deg; }
    }
    @property --lmob-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    .lmob-wrap {
      position: relative;
    }
    .lmob-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: var(--lmob-bw, 1.5px);
      background: conic-gradient(
        from var(--lmob-angle),
        #ffffff00 0%,
        #aaaaaa 15%,
        #ffffff 30%,
        #cccccc 45%,
        #888888 60%,
        #ffffff 75%,
        #aaaaaa 88%,
        #ffffff00 100%
      );
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
              mask-composite: exclude;
      opacity: 0;
      transition: opacity 0.25s ease;
      animation: lmob-spin 2.4s linear infinite;
      pointer-events: none;
      z-index: 0;
    }
    .lmob-wrap.lmob-active::before {
      opacity: 1;
    }
    .lmob-inner {
      position: relative;
      z-index: 1;
    }
  `;
  document.head.appendChild(tag);
}

export function LiquidMetalOptionBorder({
  children,
  active = false,
  borderWidth = 1.5,
  borderRadius = 12,
  className = "",
  style,
}: LiquidMetalOptionBorderProps) {
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return (
    <div
      className={`lmob-wrap${active ? " lmob-active" : ""} ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        // Static dim border always present → zero size shift on toggle
        boxShadow: `inset 0 0 0 ${borderWidth}px rgba(255,255,255,${active ? 0 : 0.08})`,
        transition: "box-shadow 0.25s ease",
        // Pass border width to CSS custom property for the ::before padding
        ["--lmob-bw" as string]: `${borderWidth}px`,
        ...style,
      }}
    >
      <div className="lmob-inner" style={{ borderRadius: `${Math.max(0, borderRadius - borderWidth)}px` }}>
        {children}
      </div>
    </div>
  );
}
