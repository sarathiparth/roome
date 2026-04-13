"use client"

import * as React from "react"
import { useState } from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Heart, X, Info, MapPin, TrendingUp, Users, Home, Sparkles, Calendar, ChevronDown, ChevronUp, CheckCircle, Star } from "lucide-react"
import { BentoGrid } from "@/components/ui/bento-grid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LifestyleIndicator {
  label: string
  value: number
  icon?: string
}

interface BaseCard {
  id: string
  type: "person" | "room" | "insight" | "group" | "event" | "special"
}

interface PersonCard extends BaseCard {
  type: "person"
  name: string
  age: number
  location: string
  image: string
  matchPercentage: number
  tags: string[]
  quote: string
  lifestyle: LifestyleIndicator[]
  details: {
    financialHabits: string
    guestPreferences: string
    conflictStyle: string
    constraints: string[]
  }
}

interface RoomCard extends BaseCard {
  type: "room"
  title: string
  location: string
  rent: number
  image: string
  occupancy: string
  tags: string[]
  matchPercentage: number
  details: {
    amenities: string[]
    availability: string
  }
}

interface InsightCard extends BaseCard {
  type: "insight"
  title: string
  description: string
  matchReason: string
  icon: string
}

interface GroupCard extends BaseCard {
  type: "group"
  members: string[]
  matchPercentage: number
  images: string[]
  description: string
}

interface EventCard extends BaseCard {
  type: "event"
  title: string
  date: string
  location: string
  image: string
  description: string
}

interface SpecialCard extends BaseCard {
  type: "special"
  title: string
  subtitle: string
  image: string
  badge: string
  matchPercentage?: number
}

type CardData = PersonCard | RoomCard | InsightCard | GroupCard | EventCard | SpecialCard

const SAMPLE_CARDS: CardData[] = [
  {
    id: "special-1",
    type: "special",
    title: "Sarah Chen",
    subtitle: "Your top match today",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    badge: "Top Match",
    matchPercentage: 94,
  },
  {
    id: "person-1",
    type: "person",
    name: "Aman Verma",
    age: 26,
    location: "Brooklyn, NY",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    matchPercentage: 89,
    tags: ["Late sleeper", "Clean", "Quiet", "Tech enthusiast"],
    quote: "Looking for someone who respects quiet time but loves weekend adventures",
    lifestyle: [
      { label: "Sleep Schedule", value: 75, icon: "🌙" },
      { label: "Cleanliness", value: 90, icon: "✨" },
      { label: "Social Level", value: 60, icon: "👥" },
    ],
    details: {
      financialHabits: "Splits bills on time, prefers digital payments",
      guestPreferences: "Occasional guests on weekends",
      conflictStyle: "Direct but respectful communication",
      constraints: ["No smoking", "Pet-friendly", "Vegetarian kitchen"],
    },
  },
  {
    id: "room-1",
    type: "room",
    title: "Spacious Loft in Williamsburg",
    location: "Williamsburg, Brooklyn",
    rent: 1450,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    occupancy: "2/3 filled",
    tags: ["Natural light", "Rooftop access", "Near subway"],
    matchPercentage: 85,
    details: {
      amenities: ["In-unit laundry", "Dishwasher", "Gym access", "Rooftop"],
      availability: "Available from March 1st",
    },
  },
  {
    id: "person-2",
    type: "person",
    name: "Maya Rodriguez",
    age: 24,
    location: "Manhattan, NY",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80",
    matchPercentage: 92,
    tags: ["Early bird", "Organized", "Social butterfly", "Yoga lover"],
    quote: "Coffee in the morning, wine in the evening, and good vibes always",
    lifestyle: [
      { label: "Sleep Schedule", value: 30, icon: "🌅" },
      { label: "Cleanliness", value: 95, icon: "✨" },
      { label: "Social Level", value: 85, icon: "👥" },
    ],
    details: {
      financialHabits: "Budget-conscious, tracks shared expenses",
      guestPreferences: "Loves hosting dinner parties",
      conflictStyle: "Prefers talking things out immediately",
      constraints: ["No smoking", "Allergic to cats", "Vegetarian"],
    },
  },
  {
    id: "insight-1",
    type: "insight",
    title: "Why you match with Aman",
    description: "You both value quiet evenings and have similar sleep schedules",
    matchReason: "Your lifestyle compatibility score is 89% based on 42 shared preferences",
    icon: "💡",
  },
  {
    id: "group-1",
    type: "group",
    members: ["You", "Aman", "Rohit"],
    matchPercentage: 86,
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    ],
    description: "Perfect trio for a 3-bedroom apartment. Similar work schedules and lifestyle preferences.",
  },
  {
    id: "person-3",
    type: "person",
    name: "Rohit Sharma",
    age: 28,
    location: "Queens, NY",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    matchPercentage: 78,
    tags: ["Night owl", "Foodie", "Gamer", "Chill vibes"],
    quote: "Work hard, game harder. Looking for laid-back roommates who get it",
    lifestyle: [
      { label: "Sleep Schedule", value: 85, icon: "🌙" },
      { label: "Cleanliness", value: 70, icon: "✨" },
      { label: "Social Level", value: 55, icon: "👥" },
    ],
    details: {
      financialHabits: "Reliable with rent, prefers Venmo",
      guestPreferences: "Rare guests, mostly online friends",
      conflictStyle: "Avoids confrontation, prefers texting",
      constraints: ["420 friendly", "No early morning noise"],
    },
  },
  {
    id: "event-1",
    type: "event",
    title: "Roommate Mixer: Brooklyn Edition",
    date: "March 15, 2024",
    location: "Brooklyn Bowl",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    description: "Meet potential roommates in person! Casual bowling and drinks event.",
  },
  {
    id: "person-4",
    type: "person",
    name: "Emily Watson",
    age: 25,
    location: "East Village, NY",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
    matchPercentage: 91,
    tags: ["Creative", "Plant parent", "Clean freak", "Bookworm"],
    quote: "Artist by day, reader by night. Need a space that feels like home",
    lifestyle: [
      { label: "Sleep Schedule", value: 50, icon: "🌙" },
      { label: "Cleanliness", value: 92, icon: "✨" },
      { label: "Social Level", value: 45, icon: "👥" },
    ],
    details: {
      financialHabits: "Freelancer, always pays on time",
      guestPreferences: "Minimal guests, values privacy",
      conflictStyle: "Calm and understanding",
      constraints: ["Must allow plants", "Quiet space needed", "Natural light essential"],
    },
  },
  {
    id: "room-2",
    type: "room",
    title: "Modern Studio with City Views",
    location: "Lower East Side",
    rent: 1650,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    occupancy: "1/2 filled",
    tags: ["City views", "Modern", "Doorman building"],
    matchPercentage: 88,
    details: {
      amenities: ["Concierge", "Fitness center", "Package room", "Bike storage"],
      availability: "Available immediately",
    },
  },
  {
    id: "special-2",
    type: "special",
    title: "Hidden Gem Alert",
    subtitle: "Rare find in your area",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    badge: "Hidden Gem",
  },
  {
    id: "person-5",
    type: "person",
    name: "Alex Kim",
    age: 27,
    location: "Astoria, Queens",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
    matchPercentage: 83,
    tags: ["Fitness enthusiast", "Early riser", "Minimalist", "Dog lover"],
    quote: "Gym at 6am, work by 9, asleep by 10. Simple life, good energy",
    lifestyle: [
      { label: "Sleep Schedule", value: 25, icon: "🌅" },
      { label: "Cleanliness", value: 88, icon: "✨" },
      { label: "Social Level", value: 70, icon: "👥" },
    ],
    details: {
      financialHabits: "Financially stable, prefers auto-pay",
      guestPreferences: "Occasional workout buddies",
      conflictStyle: "Direct and solution-focused",
      constraints: ["Has a dog", "Early morning routine", "Meal prep Sundays"],
    },
  },
  {
    id: "insight-2",
    type: "insight",
    title: "Your compatibility is rising",
    description: "Based on recent profile updates, you're matching with 23% more people",
    matchReason: "Keep your profile active to find the perfect roommate faster",
    icon: "📈",
  },
  {
    id: "person-6",
    type: "person",
    name: "Priya Patel",
    age: 23,
    location: "Jersey City, NJ",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    matchPercentage: 87,
    tags: ["Graduate student", "Quiet", "Tea lover", "Organized"],
    quote: "PhD student seeking peaceful coexistence and mutual respect",
    lifestyle: [
      { label: "Sleep Schedule", value: 45, icon: "🌙" },
      { label: "Cleanliness", value: 93, icon: "✨" },
      { label: "Social Level", value: 40, icon: "👥" },
    ],
    details: {
      financialHabits: "Student budget, very responsible",
      guestPreferences: "Rarely has guests over",
      conflictStyle: "Thoughtful and diplomatic",
      constraints: ["Needs quiet study time", "Vegetarian", "No parties"],
    },
  },
  {
    id: "event-2",
    type: "event",
    title: "Speed Roommating",
    date: "March 22, 2024",
    location: "Manhattan Coffee House",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
    description: "Quick 5-minute chats with potential roommates. Find your match faster!",
  },
]

interface SwipeCardProps {
  card: CardData
  onSwipe: (direction: "left" | "right") => void
  onExpand?: () => void
  isTop: boolean
  style?: React.CSSProperties
}

const SwipeCard: React.FC<SwipeCardProps> = ({ card, onSwipe, onExpand, isTop, style }) => {
  const [showDetails, setShowDetails] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 100 && info.offset.y < 0) {
      onExpand?.()
    } else if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left")
    }
  }

  const renderPersonCard = (person: PersonCard) => (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black">
      <div className="relative h-[60%] w-full overflow-hidden">
        <img src={person.image} alt={person.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute right-4 top-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{person.matchPercentage}</div>
              <div className="text-[10px] text-white/80">MATCH</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative h-[40%] p-6">
        <div className="mb-3">
          <h2 className="text-3xl font-bold text-white">{person.name}, {person.age}</h2>
          <div className="mt-1 flex items-center gap-1 text-sm text-white/60">
            <MapPin className="h-4 w-4" />
            <span>{person.location}</span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {person.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
        </div>

        {showDetails ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm italic text-white/80">"{person.quote}"</p>
            <div className="space-y-2">
              {person.lifestyle.map((indicator) => (
                <div key={indicator.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{indicator.icon} {indicator.label}</span>
                    <span>{indicator.value}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${indicator.value}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-white/70"
          >
            <p className="line-clamp-2">"{person.quote}"</p>
            <button
              onClick={() => setShowDetails(true)}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300"
            >
              Tap to see more →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )

  const renderRoomCard = (room: RoomCard) => (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black">
      <div className="relative h-[60%] w-full overflow-hidden">
        <img src={room.image} alt={room.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-green-500/90 text-white border-0">
            <Home className="mr-1 h-3 w-3" />
            Room
          </Badge>
        </div>
        <div className="absolute right-4 top-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{room.matchPercentage}</div>
              <div className="text-[10px] text-white/80">MATCH</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative h-[40%] p-6">
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-white">{room.title}</h2>
          <div className="mt-1 flex items-center gap-1 text-sm text-white/60">
            <MapPin className="h-4 w-4" />
            <span>{room.location}</span>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-4">
          <div className="text-3xl font-bold text-green-400">${room.rent}<span className="text-sm text-white/60">/mo</span></div>
          <div className="text-sm text-white/60">{room.occupancy}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {room.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )

  const renderInsightCard = (insight: InsightCard) => (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-900 p-8 text-center">
      <div className="mb-6 text-6xl">{insight.icon}</div>
      <h2 className="mb-4 text-3xl font-bold text-white">{insight.title}</h2>
      <p className="mb-6 text-lg text-white/80">{insight.description}</p>
      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
        <p className="text-sm text-white/90">{insight.matchReason}</p>
      </div>
    </div>
  )

  const renderGroupCard = (group: GroupCard) => (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-blue-900 to-cyan-900 p-8">
      <div className="mb-6 flex -space-x-4">
        {group.images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt=""
            className="h-20 w-20 rounded-full border-4 border-white/20 object-cover"
          />
        ))}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-6 w-6 text-white" />
        <h2 className="text-2xl font-bold text-white">{group.members.join(" + ")}</h2>
      </div>
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{group.matchPercentage}</div>
          <div className="text-[10px] text-white/80">MATCH</div>
        </div>
      </div>
      <p className="text-center text-white/80">{group.description}</p>
    </div>
  )

  const renderEventCard = (event: EventCard) => (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black">
      <div className="relative h-[60%] w-full overflow-hidden">
        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-orange-500/90 text-white border-0">
            <Calendar className="mr-1 h-3 w-3" />
            Event
          </Badge>
        </div>
      </div>
      
      <div className="relative h-[40%] p-6">
        <h2 className="mb-2 text-2xl font-bold text-white">{event.title}</h2>
        <div className="mb-2 text-sm text-white/60">{event.date}</div>
        <div className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <MapPin className="h-4 w-4" />
          <span>{event.location}</span>
        </div>
        <p className="text-sm text-white/80">{event.description}</p>
      </div>
    </div>
  )

  const renderSpecialCard = (special: SpecialCard) => (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black">
      <div className="relative h-full w-full overflow-hidden">
        <img src={special.image} alt={special.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-yellow-500/90 text-black border-0 font-bold">
            <Sparkles className="mr-1 h-3 w-3" />
            {special.badge}
          </Badge>
        </div>
        {special.matchPercentage && (
          <div className="absolute right-4 top-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{special.matchPercentage}</div>
                <div className="text-[10px] text-white/80">MATCH</div>
              </div>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="mb-2 text-4xl font-bold text-white">{special.title}</h2>
          <p className="text-lg text-white/80">{special.subtitle}</p>
        </div>
      </div>
    </div>
  )

  const renderCard = () => {
    switch (card.type) {
      case "person":
        return renderPersonCard(card as PersonCard)
      case "room":
        return renderRoomCard(card as RoomCard)
      case "insight":
        return renderInsightCard(card as InsightCard)
      case "group":
        return renderGroupCard(card as GroupCard)
      case "event":
        return renderEventCard(card as EventCard)
      case "special":
        return renderSpecialCard(card as SpecialCard)
      default:
        return null
    }
  }

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity,
        ...style,
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute h-[calc(100vh-200px)] w-full max-w-md cursor-grab active:cursor-grabbing",
        !isTop && "pointer-events-none"
      )}
      whileTap={{ cursor: "grabbing" }}
    >
      {renderCard()}
      {isTop && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <ChevronUp className="h-4 w-4 text-white/40 animate-bounce" />
          <span className="text-xs text-white/40">Swipe up for details</span>
        </div>
      )}
    </motion.div>
  )
}

const ExpandedCardView: React.FC<{ card: CardData; onClose: () => void }> = ({ card, onClose }) => {
  const renderExpandedPersonDetails = (person: PersonCard) => (
    <div className="h-full overflow-y-auto">
      <div className="relative h-96 w-full">
        <img src={person.image} alt={person.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-bold text-white">{person.name}, {person.age}</h1>
          <div className="mt-2 flex items-center gap-1 text-white/80">
            <MapPin className="h-5 w-5" />
            <span>{person.location}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{person.matchPercentage}</div>
            <div className="text-[10px] text-white">MATCH</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {person.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20">
              {tag}
            </Badge>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">About Me</h3>
          <p className="text-white/80 italic">"{person.quote}"</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Compatibility Details</h3>
          <BentoGrid 
            items={[
              {
                title: "Financial Habits",
                description: person.details.financialHabits,
                icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
                tags: ["Finance", "Rent"],
                hasPersistentHover: false
              },
              {
                title: "Guest Preferences",
                description: person.details.guestPreferences,
                icon: <Star className="w-4 h-4 text-blue-500" />,
                tags: ["Social", "Guests"],
              },
              {
                title: "Conflict Resolution",
                description: person.details.conflictStyle,
                icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
                tags: ["Communication", "Conflict"],
              },
              {
                title: "Important Constraints",
                description: person.details.constraints.join(", "),
                icon: <CheckCircle className="w-4 h-4 text-red-500" />,
                tags: ["Rules", "Boundaries"],
              }
            ]}
          />
        </div>
      </div>
    </div>
  )

  const renderExpandedRoomDetails = (room: RoomCard) => (
    <div className="h-full overflow-y-auto">
      <div className="relative h-96 w-full">
        <img src={room.image} alt={room.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-bold text-white">{room.title}</h1>
          <div className="mt-2 flex items-center gap-1 text-white/80">
            <MapPin className="h-5 w-5" />
            <span>{room.location}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-green-400">${room.rent}<span className="text-lg text-white/60">/mo</span></div>
            <div className="text-sm text-white/60 mt-1">{room.occupancy}</div>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{room.matchPercentage}</div>
              <div className="text-[10px] text-white">MATCH</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {room.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20">
              {tag}
            </Badge>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
          <div className="grid grid-cols-2 gap-2">
            {room.details.amenities.map((amenity) => (
              <div key={amenity} className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-white/90 text-sm">{amenity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Availability</h3>
          <p className="text-white/90">{room.details.availability}</p>
        </div>
      </div>
    </div>
  )

  const renderExpandedContent = () => {
    if (card.type === "person") {
      return renderExpandedPersonDetails(card as PersonCard)
    } else if (card.type === "room") {
      return renderExpandedRoomDetails(card as RoomCard)
    }
    return (
      <div className="h-full flex items-center justify-center p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        <p className="text-white/60 text-center">Detailed view not available for this card type</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-zinc-900 to-black"
    >
      {renderExpandedContent()}
    </motion.div>
  )
}

function RoommateDiscoveryEngine() {
  const [cards, setCards] = useState<CardData[]>(SAMPLE_CARDS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [expandedCard, setExpandedCard] = useState<CardData | null>(null)

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleExpand = (card: CardData) => {
    setExpandedCard(card)
  }

  const handleCloseExpanded = () => {
    setExpandedCard(null)
  }

  const handleButtonSwipe = (direction: "left" | "right") => {
    handleSwipe(direction)
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 3)

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-transparent">
      <div className="relative flex h-full w-full max-w-md flex-col items-center justify-center px-4">
        <div className="relative mb-24 h-[calc(100vh-200px)] w-full">
          {visibleCards.reverse().map((card, index) => (
            <SwipeCard
              key={card.id}
              card={card}
              onSwipe={handleSwipe}
              onExpand={() => handleExpand(card)}
              isTop={index === visibleCards.length - 1}
              style={{
                zIndex: index,
                transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
              }}
            />
          ))}
        </div>

        <div className="fixed bottom-8 left-1/2 flex -translate-x-1/2 gap-6">
          <Button
            size="lg"
            variant="outline"
            className="h-16 w-16 rounded-full border-2 border-red-500 bg-white/10 backdrop-blur-sm hover:bg-red-500/20"
            onClick={() => handleButtonSwipe("left")}
          >
            <X className="h-8 w-8 text-red-500" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full border-2 border-blue-500 bg-white/10 backdrop-blur-sm hover:bg-blue-500/20"
            onClick={() => {}}
          >
            <Info className="h-6 w-6 text-blue-500" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-16 w-16 rounded-full border-2 border-green-500 bg-white/10 backdrop-blur-sm hover:bg-green-500/20"
            onClick={() => handleButtonSwipe("right")}
          >
            <Heart className="h-8 w-8 text-green-500" />
          </Button>
        </div>

        {currentIndex >= cards.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
          >
            <div className="text-center">
              <TrendingUp className="mx-auto mb-4 h-16 w-16 text-purple-500" />
              <h2 className="mb-2 text-3xl font-bold text-white">You're all caught up!</h2>
              <p className="text-white/60">Check back later for more matches</p>
            </div>
          </motion.div>
        )}
      </div>

      {expandedCard && (
        <ExpandedCardView card={expandedCard} onClose={handleCloseExpanded} />
      )}
    </div>
  )
}

import { NavigationBar } from "@/components/navigation-bar"

export default function Demo() {
  return (
    <main className="fixed inset-0 bg-[#050505] overflow-hidden">
      {/* Layered ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.1) 0%, transparent 50%), radial-gradient(ellipse at 85% 15%, rgba(52,211,153,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.05) 0%, transparent 60%)",
        }}
      />
      <NavigationBar />
      <RoommateDiscoveryEngine />
    </main>
  )
}
