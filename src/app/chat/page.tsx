"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { PEOPLE, PersonExtended } from "@/app/explore/page"
import { NavigationBar } from "@/components/navigation-bar"
import { Search } from "lucide-react"

export default function ChatPage() {
  const matches = [...PEOPLE, ...PEOPLE].slice(0, 4);

  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Dark phone column */}
      <div className="relative h-full w-full max-w-[430px] bg-[#080808] overflow-hidden shadow-2xl flex flex-col">
        <NavigationBar />

        {/* Header */}
        <div className="sticky top-0 inset-x-0 z-30 px-5 pt-12 pb-4 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-black text-white tracking-tight">Messages</h1>
            <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Search className="h-4 w-4 text-white/70" />
            </div>
          </div>
          <p className="text-white/50 text-[13px] mt-1">You have {matches.length} new matches</p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto pt-2 pb-32" style={{ scrollbarWidth: "none" }}>
          {matches.map((person, i) => (
            <ChatItem key={`chat-${i}`} person={person} index={i} />
          ))}
        </div>
      </div>
    </main>
  )
}

function ChatItem({ person, index }: { person: PersonExtended; index: number }) {
  const router = useRouter()
  const isUnread = index < 2; // Mock unread statuses
  const lastMessages = [
    "Hey! I saw you love reading too 📚",
    "Are you still looking for a place near Koramangala?",
    "Haha yeah, that sounds perfect to me.",
    "Let me know if you want to visit the flat this weekend!"
  ];
  const msg = lastMessages[index % lastMessages.length];

  return (
    <div 
      onClick={() => router.push(`/chat/${person.id}`)}
      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/5"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10">
          <img src={person.images[0]} alt={person.name} className="w-full h-full object-cover object-top" />
        </div>
        {isUnread && (
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#080808]" />
        )}
      </div>

      {/* Message Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className={`text-[16px] truncate ${isUnread ? 'text-white font-bold' : 'text-white/90 font-medium'}`}>
            {person.name.split(" ")[0]}
          </h3>
          <span className={`text-[11px] shrink-0 ${isUnread ? 'text-emerald-400 font-medium' : 'text-white/40'}`}>
            {isUnread ? '2m ago' : '1d ago'}
          </span>
        </div>
        <p className={`text-[13px] truncate ${isUnread ? 'text-white/90 font-medium' : 'text-white/50 font-normal'}`}>
          {msg}
        </p>
      </div>
    </div>
  )
}
