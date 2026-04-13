"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PEOPLE, PersonExtended } from "@/app/explore/page"
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile } from "lucide-react"

export default function ChatRoomPage() {
  const router = useRouter()
  const params = useParams()
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [person, setPerson] = useState<PersonExtended | null>(null)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    // Find person by ID from our mock PEOPLE list
    if (idStr) {
      const numericId = parseInt(idStr.replace('p', ''), 10)
      const found = PEOPLE.find(p => p.id === numericId)
      if (found) setPerson(found)
      else setPerson(PEOPLE[0]) // fallback
    }
  }, [idStr])

  if (!person) return null

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Dark phone column */}
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
              <ArrowLeft className="h-5 w-5 text-white/90" />
            </button>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20 cursor-pointer"
                onClick={() => router.push('/explore')} // could push to their profile overview
              >
                <img src={person.images[0]} alt={person.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px]">{person.name.split(" ")[0]}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <span className="text-emerald-400/80 text-[11px] font-medium tracking-wide">Online now</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
              <Phone className="h-4.5 w-4.5" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
              <Video className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat History Background */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 relative" style={{ scrollbarWidth: "none" }}>
          
          <div className="flex justify-center mb-4">
            <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] text-white/40 uppercase tracking-widest font-semibold">Today</span>
          </div>

          {/* Incoming bubble */}
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 self-end">
              <img src={person.images[0]} alt={person.name} className="w-full h-full object-cover object-top" />
            </div>
            <div className="bg-[#222] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2.5 text-white/90 text-sm leading-relaxed shadow-sm">
              Hey! I saw you love reading too 📚 I’ve been looking for a place near {person.area}.
            </div>
          </div>
          
          {/* Incoming short bubble */}
          <div className="flex gap-3 max-w-[85%] pl-11">
            <div className="bg-[#222] border border-white/5 rounded-2xl px-4 py-2 text-white/90 text-sm leading-relaxed shadow-sm">
              When are you planning to move?
            </div>
          </div>

          {/* Outgoing bubble */}
          <div className="flex gap-3 max-w-[85%] self-end">
            <div className="bg-emerald-500 rounded-2xl rounded-br-sm px-4 py-2.5 text-black font-medium text-sm leading-relaxed shadow-[0_4px_14px_rgba(16,185,129,0.3)]">
              Hey {person.name.split(" ")[0]}! Yeah, looking to move by the 1st. 
            </div>
          </div>
          
          <div className="flex gap-3 max-w-[85%] self-end">
            <div className="bg-emerald-500 rounded-2xl px-4 py-2 text-black font-medium text-sm leading-relaxed shadow-[0_4px_14px_rgba(16,185,129,0.3)]">
              I can swing by that area this weekend if you wanted to meet up and check out some places.
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="px-4 py-3 bg-[#080808]/90 backdrop-blur-md border-t border-white/5 pb-8 relative z-20">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-1.5 py-1.5">
            <button className="h-9 w-9 flex items-center justify-center shrink-0 rounded-full hover:bg-white/10 transition-colors text-white/40">
              <Smile className="h-5 w-5" />
            </button>
            <input 
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none px-2"
              placeholder="Message..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <button 
              className={`h-9 w-9 flex items-center justify-center shrink-0 rounded-full transition-all ${msg.length > 0 ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-white/10 text-white/30'}`}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
