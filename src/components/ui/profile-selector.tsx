import * as React from "react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  subtitle?: string;
}

interface ProfileSelectorProps {
  title?: string;
  profiles: Profile[];
  onProfileSelect: (id: string) => void;
  className?: string;
}

export const ProfileSelector = ({
  title = "Who's watching?",
  profiles,
  onProfileSelect,
  className,
}: ProfileSelectorProps) => {
  return (
    <div
      className={cn(
        "flex min-h-[100dvh] w-full flex-col items-center justify-center p-4",
        className
      )}
    >
      <div className="flex flex-col items-center w-full max-w-4xl">
        <h1 className="mb-12 text-2xl font-bold tracking-tight text-white md:text-4xl text-center">
          {title}
        </h1>
        <div className="flex flex-row flex-wrap justify-center gap-6 sm:gap-10 md:gap-16">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col items-center gap-4 group w-[100px] sm:w-[130px]">
              <button
                onClick={() => onProfileSelect(profile.id)}
                aria-label={`Select profile: ${profile.label}`}
                className="group relative h-[100px] w-[100px] sm:h-[130px] sm:w-[130px] rounded-[24px] md:rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 focus:outline-none"
              >
                {/* Glassmorphic Base */}
                <div className="absolute inset-0 bg-white/[0.04] border border-white/8 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-white/20 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.12)] backdrop-blur-xl"></div>
                
                {/* Content */}
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden z-10 p-5">
                  {typeof profile.icon === 'string' ? (
                    <img
                      src={profile.icon}
                      alt={`${profile.label} icon`}
                      className="h-full w-full object-contain drop-shadow-xl"
                    />
                  ) : (
                    profile.icon
                  )}
                </div>
              </button>
              
              <div className="text-center w-full">
                <p className="text-[15px] sm:text-[17px] font-semibold text-white/70 transition-colors group-hover:text-white mb-0.5">
                  {profile.label}
                </p>
                {profile.subtitle && (
                  <p className="text-[10px] sm:text-[11px] font-medium text-white/30 uppercase tracking-wider group-hover:text-white/50 transition-colors line-clamp-2 leading-tight">
                    {profile.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
