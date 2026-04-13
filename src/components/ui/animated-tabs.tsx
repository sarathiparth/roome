"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedTabsProps {
  tabs: { label: string; icon?: React.ReactNode; id?: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab: propActive, onTabChange, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(propActive || tabs[0].label);
  
  // Keep internal state in sync with external prop if provided
  useEffect(() => {
    if (propActive) setActiveTab(propActive);
  }, [propActive]);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (container && activeTab) {
      const activeTabElement = activeTabRef.current;

      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;

        const clipLeft = offsetLeft + 16;
        const clipRight = offsetLeft + offsetWidth + 16;

        container.style.clipPath = `inset(0 ${Number(
          100 - (clipRight / container.offsetWidth) * 100,
        ).toFixed()}% 0 ${Number(
          (clipLeft / container.offsetWidth) * 100,
        ).toFixed()}% round 9999px)`; // Increased rounding for full pill
      }
    }
  }, [activeTab]);

  const handleTabClick = (label: string) => {
    setActiveTab(label);
    if (onTabChange) onTabChange(label);
  }

  return (
    <div className={cn("relative bg-white/5 border border-white/10 mx-auto flex w-fit flex-col items-center rounded-full py-2 px-4 backdrop-blur-xl shadow-2xl", className)}>
      <div
        ref={containerRef}
        className="absolute z-10 w-full overflow-hidden [clip-path:inset(0px_75%_0px_0%_round_9999px)] [transition:clip-path_0.3s_ease]"
      >
        <div className="relative flex w-full justify-center bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabClick(tab.label)}
              className="flex gap-2 h-12 items-center rounded-full p-3 px-5 text-sm font-black text-black transition-all"
              tabIndex={-1}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span className="hidden sm:inline-block tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex w-full justify-center">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.label;

          return (
            <button
              key={index}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleTabClick(tab.label)}
              className={cn(
                "flex gap-2 h-12 items-center cursor-pointer rounded-full p-3 px-5 text-sm font-semibold transition-all duration-300",
                "text-white/40 hover:text-white/80",
                "active:text-white active:scale-95 active:shadow-[0_0_25px_rgba(255,255,255,1)]"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline-block tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
