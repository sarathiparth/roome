"use client";

import { Heart, HeartHandshake, MessageCircle, User, Compass } from "lucide-react";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { useRouter, usePathname } from "next/navigation";

interface NavigationBarProps {
  onChatClick?: () => void;
  onLikedYouClick?: () => void;
  onYouLikedClick?: () => void;
}

export function NavigationBar({ onChatClick, onLikedYouClick, onYouLikedClick }: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const activeLabel =
    pathname === "/explore" ? "Explore" :
    pathname === "/profile" ? "Profile" :
    pathname === "/chat" ? "Chat" :
    pathname === "/you-liked" ? "You Liked" :
    pathname === "/liked-you" ? "Liked You" :
    "Explore";

  const handleTabChange = (label: string) => {
    if (label === "Chat") { router.push("/chat"); return; }
    if (label === "Liked You") { router.push("/liked-you"); return; }
    if (label === "You Liked") { router.push("/you-liked"); return; }
    if (label === "Explore") { router.push("/explore"); return; }
    if (label === "Profile") { router.push("/profile"); return; }
    if (onChatClick && label === "Chat") onChatClick();
    if (onLikedYouClick && label === "Liked You") onLikedYouClick();
    if (onYouLikedClick && label === "You Liked") onYouLikedClick();
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      <AnimatedTabs
        tabs={[
          { label: "Explore", icon: <Compass className="h-5 w-5" /> },
          { label: "You Liked", icon: <Heart className="h-5 w-5" /> },
          { label: "Liked You", icon: <HeartHandshake className="h-5 w-5" /> },
          { label: "Chat", icon: <MessageCircle className="h-5 w-5" /> },
          { label: "Profile", icon: <User className="h-5 w-5" /> },
        ]}
        activeTab={activeLabel}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
