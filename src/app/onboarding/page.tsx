"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Camera, MapPin, Globe2, AtSign, ArrowRight, ArrowLeft, 
  Check, Calendar as CalendarIcon, Upload, Sparkles, Building, Briefcase, GraduationCap,
  DollarSign, Moon, Coffee, Users, Flame, Wind,
  Home, Bed, Sofa, GripVertical, Trash2, ChevronLeft, ChevronRight, X, ImageIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { DOBCalendar } from "@/components/ui/dob-calendar"
import { LiquidMetalOptionBorder } from "@/components/ui/liquid-metal-option-border"
import { Waves } from "@/components/ui/wave-background"
import { saveOnboardingProfile, uploadAvatar } from "@/app/onboarding/actions"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // -- Form State --
  // Step 1: Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Basic Info
  const [occupation, setOccupation] = useState("")
  const [college, setCollege] = useState("")
  const [company, setCompany] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [instagram, setInstagram] = useState("")
  const [bio, setBio] = useState("")

  // Step 3: Move-in Preferences
  const [moveInDate, setMoveInDate] = useState("")
  const [isFlexible, setIsFlexible] = useState(false)

  // Step 4: Lifestyle & Habits
  const [sleepSchedule, setSleepSchedule] = useState("")
  const [cleanliness, setCleanliness] = useState("")
  const [smoking, setSmoking] = useState("")
  const [drinking, setDrinking] = useState("")

  // Step 5: Roommate Preferences
  const [roommateGender, setRoommateGender] = useState("")

  // Step 6: Housing Intent
  const [housingIntent, setHousingIntent] = useState("")

  // Steps 6-10: Property Listing State
  const [propLocation, setPropLocation] = useState("")
  const [propType, setPropType] = useState("")
  const [propRoomType, setPropRoomType] = useState("")
  const [propFurnishing, setPropFurnishing] = useState("")
  
  const [occCurrent, setOccCurrent] = useState("1")
  const [occTotal, setOccTotal] = useState("2")
  const [occAvailable, setOccAvailable] = useState("1")

  const [priceRent, setPriceRent] = useState("")
  const [priceDeposit, setPriceDeposit] = useState("")
  const [propMoveInDate, setPropMoveInDate] = useState("")

  const [amenities, setAmenities] = useState<string[]>([])
  const ALL_AMENITIES = [
    "WiFi", "AC", "Heating", "Gym", "Parking", "Washer", "Dryer",
    "Balcony", "Pool", "TV", "Elevator", "Pet Friendly", "Cook", "Cleaning Service"
  ]
  const toggleAmenity = (a: string) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  type PhotoObj = { id: string; url: string; file: File; category: string }
  const [photos, setPhotos] = useState<PhotoObj[]>([])
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const listingFileInputRef = useRef<HTMLInputElement>(null)

  // Steps 11+: Co-Roommate Filing (for users who already have roommates)
  type RoommateDetail = {
    name: string; age: string; occupation: string; college: string; company: string
    bio: string; instagram: string
  }
  const emptyRoommate = (): RoommateDetail => ({ name: "", age: "", occupation: "", college: "", company: "", bio: "", instagram: "" })
  const [roommateDetails, setRoommateDetails] = useState<RoommateDetail[]>([])
  
  // How many existing roommates (other than the listing owner)
  const existingRoommateCount = Math.max(0, parseInt(occCurrent) - 1)

  // Initialise roommate slots when occCurrent changes
  React.useEffect(() => {
    setRoommateDetails(Array.from({ length: existingRoommateCount }, (_, i) => roommateDetails[i] ?? emptyRoommate()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occCurrent])

  const updateRoommate = (idx: number, field: keyof RoommateDetail, val: string) => {
    setRoommateDetails(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: val }
      return next
    })
  }

  // Roommate steps: step 11 = roommate 1, step 12 = roommate 2, etc.
  const hasRoommateSteps = housingIntent === "have_room" && existingRoommateCount > 0
  // +1 for the new Lifestyle step (step 4)
  const TOTAL_STEPS = housingIntent === "have_room" ? 11 + existingRoommateCount : 6

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else handleComplete()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Upload avatar if selected
      if (fileInputRef.current?.files?.[0]) {
        const fd = new FormData()
        fd.append("avatar", fileInputRef.current.files[0])
        await uploadAvatar(fd)
      }

      // Save profile + listing data
      await saveOnboardingProfile({
        occupation, college, company, city, country, instagram, bio,
        moveInDate: moveInDate || undefined,
        moveInFlexible: isFlexible,
        sleepSchedule, cleanliness, smoking, drinking,
        roommatePref: roommateGender,
        housingIntent,
        propLocation, propType, propRoomType, propFurnishing,
        occCurrent: parseInt(occCurrent),
        occTotal: parseInt(occTotal),
        occAvailable: parseInt(occAvailable),
        rent: priceRent ? parseInt(priceRent) : undefined,
        deposit: priceDeposit ? parseInt(priceDeposit) : undefined,
        propMoveInDate: propMoveInDate || undefined,
        amenities,
      })
      // Server action redirects on success
    } catch (err) {
      console.error("Onboarding error:", err)
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
  }

  const handlePhotoUploadListing = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      file,
      category: "Room"
    }))
    setPhotos(prev => {
      const combined = [...prev, ...newPhotos]
      return combined.slice(0, 15) // Max 15
    })
  }

  const removePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const updatePhotoCat = (id: string, cat: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, category: cat } : p))
  }

  const movePhoto = (idx: number, dir: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation()
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= photos.length) return
    const newPhotos = [...photos]
    const temp = newPhotos[idx]
    newPhotos[idx] = newPhotos[newIdx]
    newPhotos[newIdx] = temp
    setPhotos(newPhotos)
  }

  const handleDragStart = (idx: number) => setDraggedIdx(idx)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return
    const newPhotos = [...photos]
    const [moved] = newPhotos.splice(draggedIdx, 1)
    newPhotos.splice(idx, 0, moved)
    setPhotos(newPhotos)
    setDraggedIdx(null)
  }

  // Helper styles
  const inputBaseStyle = "h-12 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/20"
  
  const PillBtn = ({
    active, onClick, icon: Icon, label
  }: {
    active: boolean, onClick: () => void, icon?: any, label: string
  }) => (
    <LiquidMetalOptionBorder
      active={active}
      borderWidth={1.5}
      borderRadius={12}
      className="flex-1"
    >
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 transition-all duration-300",
          active
            ? "bg-white/10 text-white shadow-sm"
            : "bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/80"
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm font-medium">{label}</span>
      </button>
    </LiquidMetalOptionBorder>
  )

  const BigCardBtn = ({
    active, onClick, title, desc
  }: {
    active: boolean, onClick: () => void, title: string, desc?: string
  }) => (
    <LiquidMetalOptionBorder
      active={active}
      borderWidth={1.5}
      borderRadius={16}
      className="w-full"
    >
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-5 rounded-2xl transition-all duration-300",
          active
            ? "bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            : "bg-white/[0.02] hover:bg-white/[0.06]"
        )}
      >
        <div className={cn("text-lg font-medium mb-1 transition-colors", active ? "text-white" : "text-white/70")}>{title}</div>
        {desc && <div className="text-sm text-white/40 leading-relaxed">{desc}</div>}
      </button>
    </LiquidMetalOptionBorder>
  )

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden select-none">
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
      
      <div className="relative z-10 w-full max-w-md h-full sm:h-auto sm:min-h-[600px] flex flex-col justify-between pt-12 pb-8 sm:py-8 px-6 sm:px-8 bg-black/40 sm:rounded-[32px] sm:border border-white/10 backdrop-blur-2xl">
        
        {/* Header / Progress */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBack}
              disabled={step === 1}
              className={cn("p-2 -ml-2 rounded-full transition-colors group", step === 1 ? "opacity-0 pointer-events-none" : "hover:bg-white/10")}
            >
              <ArrowLeft className="h-5 w-5 text-white/60 group-hover:text-white" />
            </button>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-white/50 font-mono text-xs tracking-widest uppercase">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          
          {/* Premium single continuous progress bar */}
          <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,1) 70%, rgba(255,255,255,0.85) 100%)",
                boxShadow: "0 0 12px 2px rgba(255,255,255,0.35), 0 0 4px rgba(255,255,255,0.5)",
              }}
              initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1.2] }}
            />
            {/* Shimmer on leading edge */}
            <motion.div
              className="absolute inset-y-0 w-16 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
              animate={{ left: [`${(step / TOTAL_STEPS) * 100 - 15}%`, `${(step / TOTAL_STEPS) * 100 + 2}%`] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait" initial={false}>
            
            {/* ====== STEP 1: PHOTO ====== */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col h-full items-center text-center justify-center gap-8 -mt-10"
              >
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Add a profile photo</h1>
                  <p className="text-white/50 text-sm">Roommates want to know who they&apos;ll be living with.</p>
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative group w-44 h-44 rounded-full flex items-center justify-center overflow-hidden transition-all duration-500",
                    photoPreview ? "border-2 border-white/20" : "border-2 border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/40"
                  )}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/40 group-hover:text-white/70 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium">Tap to upload</span>
                    </div>
                  )}
                </button>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
              </motion.div>
            )}

            {/* ====== STEP 2: BASIC INFO ====== */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">The Basics</h1>
                  <p className="text-white/50 text-sm">Fill in the essentials to stand out.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Occupation</label>
                    <div className="flex flex-wrap gap-2">
                      <PillBtn active={occupation === "Student"} onClick={() => setOccupation("Student")} icon={GraduationCap} label="Student" />
                      <PillBtn active={occupation === "Working"} onClick={() => setOccupation("Working")} icon={Briefcase} label="Working" />
                      <PillBtn active={occupation === "Freelancer"} onClick={() => setOccupation("Freelancer")} icon={Sparkles} label="Freelancer" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {occupation === "Student" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium mt-4">College Name</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Stanford University" className={cn(inputBaseStyle, "pl-10")} />
                        </div>
                      </motion.div>
                    )}
                    {occupation === "Working" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium mt-4">Company Name</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" className={cn(inputBaseStyle, "pl-10")} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New York" className={cn(inputBaseStyle, "pl-10")} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Country</label>
                      <div className="relative">
                        <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. USA" className={cn(inputBaseStyle, "pl-10")} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Instagram <span className="text-white/30 normal-case">(Optional)</span></label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" className={cn(inputBaseStyle, "pl-10")} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Bio</label>
                    <Textarea 
                      value={bio} onChange={(e) => setBio(e.target.value)} 
                      placeholder="A short punchy intro about your vibe, lifestyle, and habits..." 
                      className={cn(inputBaseStyle, "resize-none h-24 py-3")} 
                      maxLength={150}
                    />
                    <div className="mt-1 text-right text-xs text-white/30">{bio.length}/150</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== STEP 3: MOVE-IN PREFERENCES ====== */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">When are you moving?</h1>
                  <p className="text-white/50 text-sm">Timing is everything in roommate matching.</p>
                </div>

                <div className="space-y-6 mt-4">
                  <div className={cn("transition-opacity duration-300", isFlexible ? "opacity-40 pointer-events-none" : "opacity-100")}>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Move-in Date</label>
                    <div className="relative z-10">
                      <CalendarIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none", moveInDate ? "text-white/70" : "text-white/30")} />
                      <input
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        className={cn(
                          "flex h-12 w-full items-center justify-start rounded-xl border pl-11 pr-4 py-2 text-sm transition-all outline-none bg-transparent appearance-none",
                          moveInDate ? "border-white/30 bg-white/10 text-white shadow-sm" : "border-white/10 bg-white/[0.04] text-white/40 hover:bg-white/[0.08]",
                          "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                          "[color-scheme:dark]"
                        )}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/90 sm:bg-[#151515] px-4 text-white/30">OR</span></div>
                  </div>

                  <LiquidMetalOptionBorder
                    active={isFlexible}
                    borderWidth={1.5}
                    borderRadius={16}
                    colorFilter="hue-rotate(105deg) saturate(2.5) brightness(1.15)"
                    className="w-full"
                  >
                  <button
                    onClick={() => setIsFlexible(!isFlexible)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300",
                      isFlexible 
                        ? "bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.08)]" 
                        : "border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20"
                    )}
                  >
                    <div className="flex flex-col text-left">
                      <span className={cn("text-lg font-medium transition-colors", isFlexible ? "text-green-400" : "text-white")}>Not in a hurry</span>
                      <span className="text-sm text-white/40 mt-1">I&apos;m absolutely flexible</span>
                    </div>
                    <div className={cn("h-6 w-6 rounded-full border flex items-center justify-center transition-colors", isFlexible ? "border-green-400 bg-green-400 text-black" : "border-white/20 text-transparent")}>
                      <Check className="h-4 w-4" />
                    </div>
                  </button>
                  </LiquidMetalOptionBorder>
                </div>
              </motion.div>
            )}

            {/* ====== STEP 4: LIFESTYLE & HABITS ====== */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-7"
              >
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Your lifestyle & habits</h1>
                  <p className="text-white/50 text-sm">Help us match you with compatible roommates.</p>
                </div>

                {/* Sleep Schedule */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5" /> Sleep Schedule
                  </label>
                  <div className="flex gap-2">
                    <PillBtn active={sleepSchedule === "early"} onClick={() => setSleepSchedule("early")} label="Early bird" />
                    <PillBtn active={sleepSchedule === "night"} onClick={() => setSleepSchedule("night")} label="Night owl" />
                    <PillBtn active={sleepSchedule === "flexible"} onClick={() => setSleepSchedule("flexible")} label="Flexible" />
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                    <Wind className="h-3.5 w-3.5" /> Cleanliness
                  </label>
                  <div className="flex gap-2">
                    <PillBtn active={cleanliness === "spotless"} onClick={() => setCleanliness("spotless")} label="Spotless" />
                    <PillBtn active={cleanliness === "tidy"} onClick={() => setCleanliness("tidy")} label="Tidy" />
                    <PillBtn active={cleanliness === "relaxed"} onClick={() => setCleanliness("relaxed")} label="Relaxed" />
                  </div>
                </div>

                {/* Smoking */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5" /> Smoking
                  </label>
                  <div className="flex gap-2">
                    <PillBtn active={smoking === "yes"} onClick={() => setSmoking("yes")} label="I smoke" />
                    <PillBtn active={smoking === "outside"} onClick={() => setSmoking("outside")} label="Outside only" />
                    <PillBtn active={smoking === "no"} onClick={() => setSmoking("no")} label="Non-smoker" />
                  </div>
                </div>

                {/* Drinking */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                    <Coffee className="h-3.5 w-3.5" /> Drinking
                  </label>
                  <div className="flex gap-2">
                    <PillBtn active={drinking === "yes"} onClick={() => setDrinking("yes")} label="Social drinker" />
                    <PillBtn active={drinking === "sometimes"} onClick={() => setDrinking("sometimes")} label="Occasionally" />
                    <PillBtn active={drinking === "no"} onClick={() => setDrinking("no")} label="I don't drink" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== STEP 5: ROOMMATE PREFERENCES ====== */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Who are you comfortable living with?</h1>
                  <p className="text-white/50 text-sm">Let us know your roommate preferences.</p>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <BigCardBtn
                    title="Same gender only"
                    desc="Show me roommates of my own gender exclusively."
                    active={roommateGender === "same_exclusive"}
                    onClick={() => setRoommateGender("same_exclusive")}
                  />
                  <BigCardBtn
                    title="Prefer same gender"
                    desc="I prefer my gender, but I'm open if there's a great match."
                    active={roommateGender === "same_prefer"}
                    onClick={() => setRoommateGender("same_prefer")}
                  />
                  <BigCardBtn
                    title="Any gender"
                    desc="I'm completely open. Vibes matter most."
                    active={roommateGender === "any"}
                    onClick={() => setRoommateGender("any")}
                  />
                </div>
              </motion.div>
            )}

            {/* ====== STEP 6: HOUSING INTENT ====== */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">What are you looking for?</h1>
                  <p className="text-white/50 text-sm">Tell us your current housing situation.</p>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <BigCardBtn
                    title="I have a room"
                    desc="I have a place secured and I'm looking for someone to fill a spot."
                    active={housingIntent === "have_room"}
                    onClick={() => setHousingIntent("have_room")}
                  />
                  <BigCardBtn
                    title="I want to join a room"
                    desc="I'm looking to move into an existing lease or household."
                    active={housingIntent === "join_room"}
                    onClick={() => setHousingIntent("join_room")}
                  />
                  <BigCardBtn
                    title="Let's find a place together"
                    desc="I have no place. Let's team up, sign a lease, and hunt together."
                    active={housingIntent === "team_up"}
                    onClick={() => setHousingIntent("team_up")}
                  />
                </div>
              </motion.div>
            )}

            {/* ====== STEP 7: PROPERTY INFO ====== */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Property Details</h1>
                  <p className="text-white/50 text-sm">Tell us about the space available.</p>
                </div>
                <div className="space-y-6 mt-2">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input value={propLocation} onChange={(e) => setPropLocation(e.target.value)} placeholder="e.g. 123 Main St, Brooklyn" className={cn(inputBaseStyle, "pl-10")} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Property Type</label>
                    <div className="flex flex-wrap gap-2">
                      <PillBtn active={propType === "Apartment"} onClick={() => setPropType("Apartment")} icon={Building} label="Apartment" />
                      <PillBtn active={propType === "House"} onClick={() => setPropType("House")} icon={Home} label="House" />
                      <PillBtn active={propType === "Studio"} onClick={() => setPropType("Studio")} icon={Sparkles} label="Studio" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Room Type</label>
                    <div className="flex flex-wrap gap-2">
                      <PillBtn active={propRoomType === "Private"} onClick={() => setPropRoomType("Private")} icon={Bed} label="Private" />
                      <PillBtn active={propRoomType === "Shared"} onClick={() => setPropRoomType("Shared")} icon={Users} label="Shared" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Furnishing</label>
                    <div className="flex flex-wrap gap-2">
                      <PillBtn active={propFurnishing === "Fully"} onClick={() => setPropFurnishing("Fully")} icon={Sofa} label="Fully Furnished" />
                      <PillBtn active={propFurnishing === "Semi"} onClick={() => setPropFurnishing("Semi")} label="Semi-Furnished" />
                      <PillBtn active={propFurnishing === "Unfurnished"} onClick={() => setPropFurnishing("Unfurnished")} label="Unfurnished" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== STEP 8: OCCUPANCY ====== */}
            {step === 8 && (
              <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Occupancy</h1>
                  <p className="text-white/50 text-sm">Who's living there and how many spots are open?</p>
                </div>
                <div className="space-y-4 mt-2">
                  {[
                    { label: "Current People", val: occCurrent, set: setOccCurrent, desc: "How many people currently live there?" },
                    { label: "Total Capacity", val: occTotal, set: setOccTotal, desc: "Max number of people in the house" },
                    { label: "Available Spots", val: occAvailable, set: setOccAvailable, desc: "How many rooms/beds are you listing?" }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{item.label}</span>
                        <span className="text-xs text-white/40">{item.desc}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => item.set(Math.max(1, parseInt(item.val || "1") - 1).toString())} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20">-</button>
                        <span className="w-4 text-center text-white font-medium">{item.val}</span>
                        <button onClick={() => item.set((parseInt(item.val || "0") + 1).toString())} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ====== STEP 9: PRICING ====== */}
            {step === 9 && (
              <motion.div key="step9" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Pricing & Availability</h1>
                  <p className="text-white/50 text-sm">Set the financial expectations.</p>
                </div>
                <div className="space-y-6 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Monthly Rent</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input type="number" value={priceRent} onChange={(e) => setPriceRent(e.target.value)} placeholder="0" className={cn(inputBaseStyle, "pl-10")} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Security Deposit</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input type="number" value={priceDeposit} onChange={(e) => setPriceDeposit(e.target.value)} placeholder="0" className={cn(inputBaseStyle, "pl-10")} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Move-in Date</label>
                    <div className="relative z-10">
                      <CalendarIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none", propMoveInDate ? "text-white/70" : "text-white/30")} />
                      <input type="date" value={propMoveInDate} onChange={(e) => setPropMoveInDate(e.target.value)} className={cn("flex h-12 w-full items-center justify-start rounded-xl border pl-11 pr-4 py-2 text-sm transition-all outline-none bg-transparent appearance-none", propMoveInDate ? "border-white/30 bg-white/10 text-white shadow-sm" : "border-white/10 bg-white/[0.04] text-white/40 hover:bg-white/[0.08]", "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer", "[color-scheme:dark]")} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== STEP 10: AMENITIES ====== */}
            {step === 10 && (
              <motion.div key="step10" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Amenities</h1>
                  <p className="text-white/50 text-sm">What's included in the place?</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALL_AMENITIES.map(a => (
                    <button key={a} onClick={() => toggleAmenity(a)} className={cn("px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-300", amenities.includes(a) ? "border-white/40 bg-white/20 text-white shadow-sm" : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80")}>
                      {a}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ====== STEP 11: PHOTOS ====== */}
            {step === 11 && (
              <motion.div key="step11" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col gap-6 pb-24 h-full relative">
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Property Photos</h1>
                  <div className="flex items-center justify-between">
                    <p className="text-white/50 text-sm">Upload 3-15 images. First is cover.</p>
                    <span className={cn("text-xs font-mono", photos.length < 3 ? "text-red-400" : "text-green-400")}>{photos.length}/15</span>
                  </div>
                </div>

                {photos.length < 15 && (
                  <button onClick={() => listingFileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/40 transition-all duration-300 group">
                    <div className="h-12 w-12 mb-3 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <ImageIcon className="h-5 w-5 text-white/50 group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/70">Tap to upload photos</span>
                    <span className="text-xs text-white/40 mt-1">JPG, PNG up to 10MB</span>
                  </button>
                )}
                <input type="file" multiple accept="image/*" className="hidden" ref={listingFileInputRef} onChange={handlePhotoUploadListing} />

                <div className="grid grid-cols-2 gap-3 mt-2 pb-6">
                  <AnimatePresence>
                    {photos.map((photo, i) => (
                      <motion.div 
                        key={photo.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        draggable onDragStart={() => handleDragStart(i)} onDragOver={handleDragOver} onDrop={() => handleDrop(i)}
                        className={cn("relative group rounded-xl overflow-hidden aspect-square border transition-all cursor-grab active:cursor-grabbing", draggedIdx === i ? "opacity-50 border-white" : "border-white/10")}
                      >
                        <img src={photo.url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                        
                        <div className="absolute inset-x-0 top-0 p-2 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                          {i === 0 ? (
                            <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-wider font-semibold text-white">Cover</div>
                          ) : <div />}
                          <button onClick={(e) => removePhoto(photo.id, e)} className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-opacity-70 hover:text-white hover:bg-red-500/80 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        {/* Mobile reordering + select overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2">
                          <select 
                            value={photo.category} onChange={(e) => updatePhotoCat(photo.id, e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded text-xs text-white px-2 py-1 outline-none appearance-none cursor-pointer"
                          >
                            <option value="Room">Room</option>
                            <option value="Hall">Hall</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Building">Building</option>
                          </select>
                          <div className="flex justify-between items-center px-1">
                            <button disabled={i===0} onClick={(e) => movePhoto(i, -1, e)} className="text-white/50 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                            <GripVertical className="h-4 w-4 text-white/30 hidden sm:block" />
                            <button disabled={i===photos.length-1} onClick={(e) => movePhoto(i, 1, e)} className="text-white/50 hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ====== STEPS 12+: CO-ROOMMATE FILING ====== */}
            {hasRoommateSteps && step >= 12 && (() => {
              const rmIdx = step - 12
              const rm = roommateDetails[rmIdx] ?? emptyRoommate()
              return (
                <motion.div
                  key={`roommate-${rmIdx}`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="flex flex-col gap-6"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40 font-medium mb-1">Existing Roommate {rmIdx + 1} of {existingRoommateCount}</p>
                    <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Tell us about your current roommate</h1>
                    <p className="text-white/50 text-sm">This helps future roommates know who they'll be living with.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Their Name</label>
                      <Input
                        value={rm.name}
                        onChange={(e) => updateRoommate(rmIdx, "name", e.target.value)}
                        placeholder="e.g. Rahul"
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Age</label>
                      <Input
                        type="number"
                        value={rm.age}
                        onChange={(e) => updateRoommate(rmIdx, "age", e.target.value)}
                        placeholder="e.g. 24"
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Occupation</label>
                      <div className="flex gap-2">
                        {(["Student", "Working", "Freelance"] as const).map((occ) => (
                          <button
                            key={occ}
                            onClick={() => updateRoommate(rmIdx, "occupation", occ)}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300",
                              rm.occupation === occ
                                ? "border-white/40 bg-white/15 text-white"
                                : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20"
                            )}
                          >
                            {occ}
                          </button>
                        ))}
                      </div>
                    </div>
                    <AnimatePresence>
                      {rm.occupation === "Student" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">College</label>
                          <Input value={rm.college} onChange={(e) => updateRoommate(rmIdx, "college", e.target.value)} placeholder="e.g. IIT Bombay" className={inputBaseStyle} />
                        </motion.div>
                      )}
                      {rm.occupation === "Working" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Company</label>
                          <Input value={rm.company} onChange={(e) => updateRoommate(rmIdx, "company", e.target.value)} placeholder="e.g. Google" className={inputBaseStyle} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">Instagram <span className="text-white/30 normal-case">(Optional)</span></label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input value={rm.instagram} onChange={(e) => updateRoommate(rmIdx, "instagram", e.target.value)} placeholder="username" className={cn(inputBaseStyle, "pl-10")} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block font-medium">About them <span className="text-white/30 normal-case">(Optional)</span></label>
                      <Textarea
                        value={rm.bio}
                        onChange={(e) => updateRoommate(rmIdx, "bio", e.target.value)}
                        placeholder="A quick note about their personality, habits, interests..."
                        className={cn(inputBaseStyle, "resize-none h-20 py-3")}
                        maxLength={120}
                      />
                      <div className="mt-1 text-right text-xs text-white/30">{rm.bio.length}/120</div>
                    </div>
                  </div>
                </motion.div>
              )
            })()}

          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-white/5 flex gap-4 shrink-0">
          <Button 
            className="w-full h-14 bg-white text-black hover:bg-white/90 text-base font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
            onClick={handleNext}
            disabled={isLoading || (step === 11 && photos.length < 3)}
          >
            {isLoading ? "Setting up..."
              : step === TOTAL_STEPS ? "Finish Profile"
              : step >= 12 ? `Save & ${step < TOTAL_STEPS ? `Next Roommate (${step - 11}/${existingRoommateCount})` : "Finish"}`
              : "Continue"}
          </Button>
        </div>
      </div>
    </main>
  )
}
