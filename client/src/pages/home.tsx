import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Mountain, Zap, Target, Activity } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import type { User, TodayStatsResponse, DailyQuoteResponse } from "@shared/schema";

export default function Home() {
  const { user: authUser } = useAuth();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user", authUser?.id],
    enabled: !!authUser?.id,
  });

  const { data: todayStats } = useQuery<TodayStatsResponse>({
    queryKey: ["/api/stats/today", authUser?.id],
    enabled: !!authUser?.id,
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: quote, isLoading: quoteLoading } = useQuery<DailyQuoteResponse>({
    queryKey: ["/api/quote", authUser?.id],
    enabled: !!authUser?.id,
  });

  const summaryItems = [
    {
      icon: Mountain,
      label: "Climbs",
      value: todayStats?.climbs || 0,
      color: "text-climb-blue"
    },
    {
      icon: Zap,
      label: "Flashes", 
      value: todayStats?.flashes || 0,
      color: "text-climb-orange"
    },
    {
      icon: Target,
      label: "Sends",
      value: todayStats?.sends || 0,
      color: "text-climb-green"
    },
    {
      icon: Activity,
      label: "Projects",
      value: todayStats?.projects || 0,
      color: "text-climb-purple"
    },
  ];

  return (
    <div className="py-4 space-y-4">
      {/* Welcome Section */}
      <div className="retro-container-accent p-4">
        <h2 className="retro-heading text-center text-lg">
          {user?.lastLoginAt ? 
            `Welcome back, ${(authUser as any)?.firstName || user?.firstName || "Climber"}!` : 
            `Welcome, ${(authUser as any)?.firstName || user?.firstName || "Climber"}!`
          }
        </h2>

        {/* Streak Section */}
        <div className="retro-container mt-4 p-4 text-center">
          <div className="flex items-center justify-center space-x-3">
            <span className="retro-body">You're on a</span>
            <div className="retro-container-primary px-4 py-2">
              <span className="retro-title text-3xl">{user?.currentStreak || 0}</span>
            </div>
            <span className="retro-body">day streak!</span>
            {(user?.currentStreak || 0) >= 1 && (
              <video
                autoPlay
                loop
                muted
                className="w-8 h-8 pixel-art"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.classList.remove('hidden');
                  }
                }}
              >
                <source src="/fire-animation.webm" type="video/webm" />
              </video>
            )}
            <span className={`text-2xl ${(user?.currentStreak || 0) >= 1 ? 'hidden' : ''}`}>🔥</span>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="retro-container p-4">
        <h3 className="retro-heading text-lg mb-4">Your Summary</h3>

        <div className="grid grid-cols-2 gap-3">
          {summaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="retro-container-accent p-4 text-center retro-bounce">
                <Icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} strokeWidth={3} />
                <div className="retro-title text-2xl mb-1">{item.value}</div>
                <div className="retro-label">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote Section */}
      <div className="retro-container p-4">
        <h3 className="retro-heading text-lg mb-3">Daily Motivation</h3>
        <div className="retro-container-accent p-4 text-center">
          {quoteLoading ? (
            <div className="retro-body text-climb-gray">Loading motivation...</div>
          ) : (
            <div className="retro-body italic">"{(quote as any)?.quote || "Keep climbing, one hold at a time!"}"</div>
          )}
        </div>
      </div>
    </div>
  );
}