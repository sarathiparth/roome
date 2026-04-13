"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DOBCalendarProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  onClose: () => void;
}

const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function DOBCalendar({ value, onChange, onClose }: DOBCalendarProps) {
  // Parse initial value or default to 2000-01-01 for DOB
  const initialDate = value ? new Date(value) : new Date(2000, 0, 1);
  const [currentDate, setCurrentDate] = useState(initialDate);

  const [view, setView] = useState<"days" | "months" | "years">("days");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const prevAction = () => {
    if (view === "days") setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    else if (view === "months") setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
    else if (view === "years") setCurrentDate(new Date(currentYear - 16, currentMonth, 1));
  };
  const nextAction = () => {
    if (view === "days") setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    else if (view === "months") setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
    else if (view === "years") setCurrentDate(new Date(currentYear + 16, currentMonth, 1));
  };
  
  const handleDayClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    onChange(`${currentYear}-${monthStr}-${dayStr}`);
    onClose();
  };

  // Days calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const renderCalendarDays = () => {
    const days: React.ReactNode[] = [];

    // Header (SUN, MON, etc)
    dayNames.forEach((day, i) => {
      days.push(
        <div key={`header-${day}`} className="flex h-8 w-8 items-center justify-center">
          <span className="text-[10px] font-medium text-white/40">{day}</span>
        </div>
      );
    });

    // Empty start cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-start-${i}`} className="h-8 w-8" />);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      // Check if selected
      const isSelected = value && 
        new Date(value).getDate() === i && 
        new Date(value).getMonth() === currentMonth && 
        new Date(value).getFullYear() === currentYear;

      days.push(
        <button
          key={`date-${i}`}
          onClick={(e) => {
            e.stopPropagation();
            handleDayClick(i);
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-all duration-200",
            isSelected 
              ? "bg-white text-black font-semibold shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="w-full sm:w-[280px] rounded-2xl border border-white/10 bg-[#1a1a1a] p-3 shadow-xl backdrop-blur-xl">
      <div
        className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
        style={{ boxShadow: "0px 2px 1.5px 0px rgba(255,255,255,0.05) inset" }}
      >
        {/* Header Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); prevAction(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-1 text-sm font-medium text-white">
            {view !== "years" && (
              <>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setView("months"); }}
                  className="hover:text-white/70 transition-colors"
                >
                  {monthNames[currentMonth]}
                </button>
                <span className="text-white/30">•</span>
              </>
            )}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setView("years"); }}
              className="hover:text-white/70 transition-colors"
            >
              {view === "years" ? `${currentYear - (currentYear % 16)} - ${currentYear - (currentYear % 16) + 15}` : currentYear}
            </button>
          </div>

          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); nextAction(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Grid Views */}
        {view === "days" && (
          <div className="grid grid-cols-7 gap-y-1 gap-x-1">
            {renderCalendarDays()}
          </div>
        )}

        {view === "months" && (
          <div className="grid grid-cols-3 gap-2 py-2">
            {monthNames.map((m, i) => (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentDate(new Date(currentYear, i, 1));
                  setView("days");
                }}
                className={cn(
                  "flex h-10 items-center justify-center rounded-xl text-sm transition-all duration-200",
                  currentMonth === i 
                    ? "bg-white text-black font-semibold shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {view === "years" && (
          <div className="grid grid-cols-4 gap-2 py-2">
            {Array.from({ length: 16 }).map((_, i) => {
              const startYear = currentYear - (currentYear % 16);
              const year = startYear + i;
              return (
                <button
                  key={year}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentDate(new Date(year, currentMonth, 1));
                    setView("months");
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-xl text-sm transition-all duration-200",
                    currentYear === year 
                      ? "bg-white text-black font-semibold shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {year}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
