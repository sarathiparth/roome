"use client"; // Required for state and event handlers

import * as React from "react";
import { cn } from "@/lib/utils";

// --- PROPS INTERFACE ---
export interface InteractiveProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  imagePosition?: string;
  logoUrl?: string;
  title: string;
  description?: string;
  price?: string;
  children?: React.ReactNode;
}

// --- COMPONENT DEFINITION ---
export function InteractiveProductCard({
  className,
  imageUrl,
  imagePosition = "center",
  logoUrl,
  title,
  description,
  price,
  children,
  ...props
}: InteractiveProductCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  // --- MOUSE MOVE HANDLER ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateX = (y - height / 2) / (height / 2) * -8; // Max rotation 8deg
    const rotateY = (x - width / 2) / (width / 2) * 8;   // Max rotation 8deg

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: "transform 0.1s ease-out",
    });
  };

  // --- MOUSE LEAVE HANDLER ---
  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.4s ease-in-out",
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={cn(
        "relative w-full max-w-[340px] aspect-[9/12] rounded-3xl shadow-lg bg-transparent",
        "transform-style-3d", // Enables 3D transformations for children
        className
      )}
      {...props}
    >
      {/* Background Image - scales slightly to avoid showing edges on tilt */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover rounded-3xl transition-transform duration-300 group-hover:scale-110"
        style={{ transform: "translateZ(-20px) scale(1.1)", objectPosition: imagePosition }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl" />

      {/* Main Content with 3D effect */}
      <div
        className="absolute inset-0 p-5 flex flex-col pointer-events-none"
        style={{ transform: "translateZ(40px)" }}
      >
        {/* Glassmorphism Header */}
        <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-[48px] shadow-2xl">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            {description && <p className="text-xs text-white/70">{description}</p>}
          </div>
          {logoUrl && <img src={logoUrl} alt="Brand Logo" className="h-4 w-auto" />}
        </div>

        {/* Price Tag - Absolute position for pixel perfection */}
        {price && (
          <div className="absolute top-[108px] left-5">
            <div className="rounded-full bg-black/40 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              {price}
            </div>
          </div>
        )}

        {/* Dynamic Children Area */}
        {children && (
          <div className="mt-auto w-full pointer-events-auto z-10 flex flex-col gap-4">
            {children}
          </div>
        )}

        {/* Pagination Dots - Filtered out if children exist */}
        {!children && (
          <div className="mt-auto flex w-full justify-center gap-2 pb-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  index === 0 ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
