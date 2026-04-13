"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Waves } from "@/components/ui/wave-background"
import { cn } from "@/lib/utils"
import { login } from "@/app/auth/actions"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.set("email", email)
    formData.set("password", password)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
    // On success, the server action redirects automatically
  }

  const inputBase =
    "w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 text-sm px-4 outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all duration-300"

  return (
    <main className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* ── Waves background — identical to vibe check ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Waves
          className="absolute inset-0 opacity-60 mix-blend-screen"
          backgroundColor="transparent"
          strokeColor="rgba(255, 255, 255, 0.4)"
          pointerSize={0}
        />
        {/* Radial top glow */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 0%,rgba(255,255,255,0.05),transparent 55%)" }}
        />
      </div>

      {/* ── Glassmorphic form card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 0.68, 0, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div
          className="rounded-[28px] px-8 py-10 flex flex-col gap-8"
          style={{
            background: "rgba(10, 10, 12, 0.72)",
            backdropFilter: "blur(32px) saturate(160%)",
            WebkitBackdropFilter: "blur(32px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <div className="space-y-1.5">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium">Roomi</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-white/45 text-sm">Sign in to find your perfect flatmate.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={cn(inputBase, "pl-10")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={cn(inputBase, "pl-10 pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
                Forgot password?
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
              className={cn(
                "w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2",
                isLoading
                  ? "bg-white/20 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90 shadow-[0_0_28px_rgba(255,255,255,0.12)]"
              )}
            >
              {isLoading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-white/60 hover:text-white underline underline-offset-2 transition-colors font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  )
}
