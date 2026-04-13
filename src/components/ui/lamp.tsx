"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampBackground = ({ className }: { className?: string }) => {
  return (
    <div className={cn("absolute inset-x-0 -top-24 flex w-full flex-none scale-y-125 items-center justify-center isolate z-0 h-40 pointer-events-none", className)}>
        <motion.div
          initial={{ opacity: 0.5, width: "10rem" }}
          whileInView={{ opacity: 1, width: "20rem" }}
          transition={{
            delay: 0.1,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(from 70deg at center top, rgba(245, 158, 11, 0.5), transparent, transparent)`,
          }}
          className="absolute inset-auto right-1/2 h-40 overflow-visible w-[20rem] text-white"
        >
          <div className="absolute w-[100%] left-0 bg-transparent h-24 bottom-0 z-20" style={{ WebkitMaskImage: "linear-gradient(to top, white, transparent)", maskImage: "linear-gradient(to top, white, transparent)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }} />
          <div className="absolute w-24 h-[100%] left-0 bg-transparent bottom-0 z-20" style={{ WebkitMaskImage: "linear-gradient(to right, white, transparent)", maskImage: "linear-gradient(to right, white, transparent)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0.5, width: "10rem" }}
          whileInView={{ opacity: 1, width: "20rem" }}
          transition={{
            delay: 0.1,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, rgba(245, 158, 11, 0.5))`,
          }}
          className="absolute inset-auto left-1/2 h-40 w-[20rem] text-white"
        >
          <div className="absolute w-24 h-[100%] right-0 bg-transparent bottom-0 z-20" style={{ WebkitMaskImage: "linear-gradient(to left, white, transparent)", maskImage: "linear-gradient(to left, white, transparent)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }} />
          <div className="absolute w-[100%] right-0 bg-transparent h-24 bottom-0 z-20" style={{ WebkitMaskImage: "linear-gradient(to top, white, transparent)", maskImage: "linear-gradient(to top, white, transparent)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }} />
        </motion.div>
        
        <div className="absolute top-1/2 h-32 w-full translate-y-12 scale-x-150 bg-black/60 blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-32 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        
        <div className="absolute inset-auto z-50 h-36 w-full max-w-[28rem] -translate-y-1/2 rounded-full bg-amber-500 opacity-20 blur-3xl"></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.1,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-24 w-48 -translate-y-[4rem] rounded-full bg-amber-400 opacity-30 blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.1,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[5rem] bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
        ></motion.div>

        <div className="absolute inset-auto z-40 h-32 w-full -translate-y-[8rem] bg-black/0"></div>
    </div>
  );
};

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start overflow-visible w-full z-0 pt-20",
        className
      )}
    >
      <LampBackground />
      <div className="relative z-50 flex w-full flex-col items-center">
        {children}
      </div>
    </div>
  );
};
