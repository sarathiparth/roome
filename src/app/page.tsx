"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { LayoutGroup, motion, AnimatePresence } from "motion/react"
import { TextRotate } from "@/components/ui/text-rotate"
import { Waves } from "@/components/ui/wave-background"
import { NeonButton } from "@/components/ui/neon-button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  ChevronRight,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Phase = "splash" | "auth"
type Mode = "login" | "signup"
type LoginMethod = "select" | "phone" | "email"
type LoginStep = "credentials" | "otp" | "forgot-password" | "forgot-sent"

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("splash")

  return (
    <main
      className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden cursor-pointer"
      onClick={() => phase === "splash" && setPhase("auth")}
    >
      {/* ── Waves background — identical to vibe check ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Waves
          className="absolute inset-0 opacity-60 mix-blend-screen"
          backgroundColor="transparent"
          strokeColor="rgba(255, 255, 255, 0.4)"
          pointerSize={0}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 0%,rgba(255,255,255,0.05),transparent 55%)" }}
        />
      </div>

      <AnimatePresence mode="wait">
        {phase === "splash" ? (
          <SplashView key="splash" onContinue={() => setPhase("auth")} />
        ) : (
          <AuthView key="auth" />
        )}
      </AnimatePresence>
    </main>
  )
}

/* ================================================================== */
/*  SPLASH VIEW                                                        */
/* ================================================================== */
function SplashView({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      exit={{ opacity: 0, scale: 0.92, y: -30 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <LayoutGroup>
        <motion.div
          className="flex items-center gap-0 select-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 200,
            delay: 0.2,
          }}
        >
          {/* Metallic white pill with rotating text */}
          <motion.div
            className="relative flex items-center justify-center rounded-full px-5 py-2.5 sm:px-7 sm:py-3.5 md:px-9 md:py-4 overflow-hidden"
            layout
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            style={{
              background: "linear-gradient(145deg, #c8c8c8 0%, #f5f5f5 18%, #ffffff 32%, #e8e8e8 50%, #ffffff 68%, #d0d0d0 85%, #e8e8e8 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.6), 0 0 24px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.1)",
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
            />
            <TextRotate
              texts={["roo", "रू"]}
              mainClassName="text-black font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight justify-center items-center"
              splitBy="characters"
              staggerFrom="last"
              staggerDuration={0.03}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-120%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 400,
              }}
              rotationInterval={2500}
              splitLevelClassName="overflow-hidden"
              elementLevelClassName="pb-1"
            />
          </motion.div>

          {/* Static "me" text */}
          <motion.span
            className="text-white font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight ml-1 sm:ml-1.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 200,
              delay: 0.5,
            }}
          >
            me
          </motion.span>
        </motion.div>
      </LayoutGroup>

      {/* Tagline */}
      <motion.p
        className="mt-16 text-white/30 text-xs sm:text-sm tracking-[0.3em] uppercase font-light"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        find your space
      </motion.p>

      {/* Touch to continue button */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <NeonButton 
          variant="roomi"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
        >
          Touch to continue
        </NeonButton>
      </motion.div>
    </motion.div>
  )
}

/* ================================================================== */
/*  SHARED UI PIECES                                                  */
/* ================================================================== */
function Spinner({ dark = false }: { dark?: boolean }) {
  return <span className={cn("h-4 w-4 border-2 rounded-full animate-spin", dark ? "border-black/20 border-t-black" : "border-white/20 border-t-white")} />
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors mb-2 w-fit">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
    >
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {message}
    </motion.div>
  )
}

/* ================================================================== */
/*  AUTH VIEW                                                          */
/* ================================================================== */
function AuthView() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>("login")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login state
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("select")
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials")
  const [loginPhone, setLoginPhone] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginOtp, setLoginOtp] = useState(["","","","","",""])
  const [forgotEmail, setForgotEmail] = useState("")

  // Signup state — Name + Email + Password
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [showSignupPassword, setShowSignupPassword] = useState(false)

  const loginOtpRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const clearError = () => setError(null)

  const resetLogin = () => {
    setLoginMethod("select"); setLoginStep("credentials")
    setLoginPhone(""); setLoginEmail(""); setLoginPassword("")
    setLoginOtp(["","","","","",""]); setForgotEmail(""); setShowPassword(false)
    clearError()
  }
  const resetSignup = () => {
    setSignupName(""); setSignupEmail(""); setSignupPassword("")
    clearError()
  }
  const switchMode = (to: Mode) => { if (to === "login") resetLogin(); else resetSignup(); setMode(to) }

  const handleOtpChange = (
    setOtp: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number, value: string
  ) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return
    setOtp(prev => { const next = [...prev]; next[index] = value; return next })
    if (value && index < 5) requestAnimationFrame(() => refs.current[index + 1]?.focus())
  }
  const handleOtpKeyDown = (
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number, e: React.KeyboardEvent, otp: string[]
  ) => { if (e.key === "Backspace" && !otp[index] && index > 0) { requestAnimationFrame(() => refs.current[index - 1]?.focus()) } }

  const otpInputClass = (digit: string) => cn("h-12 w-10 rounded-lg border text-center text-lg font-semibold transition-all",
    "border-white/10 bg-white/[0.04] text-white",
    "focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/[0.08]",
    digit && "border-white/30 bg-white/[0.08]")

  // ── Auth handlers ──────────────────────────────────────────────────

  /** Email + password sign in */
  const handleEmailPasswordLogin = async () => {
    clearError()
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    setIsLoading(false)
    if (error) { setError(error.message); return }
    router.push("/explore")
  }

  /** Send OTP — login only (phone or email) */
  const handleSendOtp = async () => {
    clearError()
    setIsLoading(true)
    const { error } = loginMethod === "phone"
      ? await supabase.auth.signInWithOtp({ phone: loginPhone })
      : await supabase.auth.signInWithOtp({ email: loginEmail })
    setIsLoading(false)
    if (error) { setError(error.message); return }
    setLoginStep("otp")
  }

  /** Email + password signup */
  const handleEmailSignup = async () => {
    clearError()
    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { full_name: signupName } },
    })
    setIsLoading(false)
    if (error) { setError(error.message); return }
    router.push("/onboarding")
  }

  /** Verify OTP (login) */
  const handleVerifyLoginOtp = async () => {
    clearError()
    setIsLoading(true)
    const token = loginOtp.join("")
    const { error } = await supabase.auth.verifyOtp(
      loginMethod === "phone"
        ? { phone: loginPhone, token, type: "sms" }
        : { email: loginEmail, token, type: "email" }
    )
    setIsLoading(false)
    if (error) { setError(error.message); return }
    router.push("/explore")
  }



  /** Password reset email */
  const handleForgotPassword = async () => {
    clearError()
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setIsLoading(false)
    if (error) { setError(error.message); return }
    setLoginStep("forgot-sent")
  }

  const loginGoBack = () => {
    clearError()
    if (loginStep === "otp") { setLoginStep("credentials"); setLoginOtp(["","","","","",""]) }
    else if (loginStep === "forgot-password" || loginStep === "forgot-sent") setLoginStep("credentials")
    else { setLoginMethod("select") }
  }

  return (
    <motion.div
      className="relative z-10 w-full max-w-sm px-4 py-8 overflow-y-auto max-h-screen [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo */}
      <motion.div className="mb-6 flex justify-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
        <div className="flex items-center gap-0 select-none">
          <div className="flex items-center justify-center bg-white rounded-full px-4 py-1.5">
            <span className="text-black font-semibold text-2xl tracking-tight">roo</span>
          </div>
          <span className="text-white font-semibold text-2xl tracking-tight ml-0.5">me</span>
        </div>
      </motion.div>

      {/* Mode toggle */}
      <motion.div className="mb-6 flex justify-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}>
        <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
          <button onClick={() => switchMode("login")} className={cn("rounded-full px-6 py-1.5 text-sm font-medium transition-all duration-300", mode === "login" ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white/70")}>Log in</button>
          <button onClick={() => switchMode("signup")} className={cn("rounded-full px-6 py-1.5 text-sm font-medium transition-all duration-300", mode === "signup" ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white/70")}>Sign up</button>
        </div>
      </motion.div>



      {/* ── LOGIN ── */}
      {mode === "login" && (
        <>
          {loginMethod === "select" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-semibold tracking-tight text-white">Welcome back</CardTitle>
                  <CardDescription className="text-white/50">Choose how you&apos;d like to log in</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4">
                  <Button variant="outline" className="w-full h-12 justify-between border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white hover:scale-[1.02]" onClick={() => setLoginMethod("phone")}>
                    <span className="flex items-center gap-3"><Phone className="h-4 w-4 text-white/60" />Continue with Phone</span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </Button>
                  <Button variant="outline" className="w-full h-12 justify-between border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white hover:scale-[1.02]" onClick={() => setLoginMethod("email")}>
                    <span className="flex items-center gap-3"><Mail className="h-4 w-4 text-white/60" />Continue with Email</span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {loginMethod !== "select" && loginStep === "credentials" && (
            <Card className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <BackBtn onClick={loginGoBack} />
                <CardTitle className="text-xl font-semibold tracking-tight text-white">{loginMethod === "phone" ? "Phone" : "Email"} login</CardTitle>
                <CardDescription className="text-white/50">Sign in with OTP or password</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">{loginMethod === "phone" ? "Phone Number" : "Email Address"}</Label>
                  <div className="relative">
                    {loginMethod === "phone" ? <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" /> : <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />}
                    {loginMethod === "phone"
                      ? <Input type="tel" placeholder="+91 98765 43210" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} className="pl-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />
                      : <Input type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />}
                  </div>
                </div>
                {/* Password (email only) */}
                {loginMethod === "email" && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70 text-xs uppercase tracking-wider">Password</Label>
                      <button onClick={() => setLoginStep("forgot-password")} className="text-xs text-white/40 hover:text-white transition-colors">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {error && <ErrorBanner message={error} />}
                {loginMethod === "email" && (
                  <Button className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium hover:scale-[1.02]"
                    onClick={handleEmailPasswordLogin}
                    disabled={!loginEmail || !loginPassword || isLoading}>
                    {isLoading ? <span className="flex items-center gap-2"><Spinner dark />Signing in…</span> : "Sign in"}
                  </Button>
                )}
                <div className="relative my-1"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-white/30">or</span></div></div>
                <Button variant="outline" className="w-full h-11 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white hover:scale-[1.02]"
                  onClick={handleSendOtp}
                  disabled={(loginMethod === "phone" ? !loginPhone : !loginEmail) || isLoading}>
                  {isLoading ? <span className="flex items-center gap-2"><Spinner />Sending OTP…</span> : "Sign in with OTP"}
                </Button>
              </CardContent>
            </Card>
          )}

          {loginStep === "otp" && (
            <Card className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <BackBtn onClick={loginGoBack} />
                <CardTitle className="text-xl font-semibold tracking-tight text-white">Verify OTP</CardTitle>
                <CardDescription className="text-white/50">6-digit code sent to <span className="text-white/70 font-mono">{loginMethod === "phone" ? loginPhone : loginEmail}</span></CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 pt-4">
                <div className="flex justify-center gap-2">
                  {loginOtp.map((digit, i) => (
                    <input key={i} ref={(el) => { loginOtpRefs.current[i] = el }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(setLoginOtp, loginOtpRefs, i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(loginOtpRefs, i, e, loginOtp)}
                      className={otpInputClass(digit)} />
                  ))}
                </div>
                {error && <ErrorBanner message={error} />}
                <Button className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium hover:scale-[1.02]" onClick={handleVerifyLoginOtp} disabled={loginOtp.some((d) => !d) || isLoading}>
                  {isLoading ? <span className="flex items-center gap-2"><Spinner dark />Verifying…</span> : "Verify & Sign in"}
                </Button>
                <p className="text-center text-sm text-white/40">Didn&apos;t receive? <button className="text-white/70 hover:text-white underline underline-offset-4" onClick={handleSendOtp}>Resend</button></p>
              </CardContent>
            </Card>
          )}

          {loginStep === "forgot-password" && (
            <Card className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <BackBtn onClick={loginGoBack} />
                <CardTitle className="text-xl font-semibold tracking-tight text-white">Reset password</CardTitle>
                <CardDescription className="text-white/50">We&apos;ll send a reset link to your email</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />
                  </div>
                </div>
                {error && <ErrorBanner message={error} />}
                <Button className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium hover:scale-[1.02]"
                  onClick={handleForgotPassword}
                  disabled={!forgotEmail || isLoading}>
                  {isLoading ? <span className="flex items-center gap-2"><Spinner dark />Sending…</span> : "Send reset link"}
                </Button>
              </CardContent>
            </Card>
          )}

          {loginStep === "forgot-sent" && (
            <Card className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-base mb-1">Check your inbox</p>
                  <p className="text-white/50 text-sm">Reset link sent to <span className="text-white/70 font-mono">{forgotEmail}</span></p>
                </div>
                <Button variant="outline" className="w-full h-11 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white mt-2" onClick={loginGoBack}>
                  Back to sign in
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── SIGNUP ── */}
      {mode === "signup" && (
        <Card className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white/60" /> Create your account
            </CardTitle>
            <CardDescription className="text-white/50">Find your perfect flatmate, smarter.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label className="text-white/70 text-xs uppercase tracking-wider">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input placeholder="John Doe" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="pl-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-white/70 text-xs uppercase tracking-wider">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-white/70 text-xs uppercase tracking-wider">Password *</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input type={showSignupPassword ? "text" : "password"} placeholder="Min. 8 characters" minLength={8} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10 h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20" />
                <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <ErrorBanner message={error} />}
            <Button className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium hover:scale-[1.02] mt-2"
              onClick={handleEmailSignup}
              disabled={!signupName.trim() || !signupEmail || signupPassword.length < 8 || isLoading}>
              {isLoading ? <span className="flex items-center gap-2"><Spinner dark />Creating account…</span> : <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Get started</span>}
            </Button>
          </CardContent>
        </Card>
      )}

      <motion.p className="mt-8 text-center text-xs text-white/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        By continuing you agree to our <span className="underline cursor-pointer hover:text-white/40">Terms</span> &amp; <span className="underline cursor-pointer hover:text-white/40">Privacy Policy</span>
      </motion.p>
    </motion.div>
  )
}