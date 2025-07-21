import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Zap, Flame, Target, Plus } from "lucide-react";
import LogClimbModal from "@/components/log-climb-modal";

export default function Home() {
  const [showLogModal, setShowLogModal] = useState(false);

  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["api", "auth", "user"],
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["api", "user"],
  });

  const { data: todayStats } = useQuery({
    queryKey: ["api", "stats", "today"],
  });

  if (userLoading || authLoading) {
    return (
      <div className="py-2 px-0 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">🧗</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const summaryItems = [
    {
      icon: Mountain,
      label: "Climbs Today:",
      value: todayStats?.climbs || 0,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Zap,
      label: "Flashes Today:",
      value: todayStats?.flashes || 0,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: Flame,
      label: "Sends Today:",
      value: todayStats?.sends || 0,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: Target,
      label: "Project Today:",
      value: todayStats?.projects || 0,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="py-2">
      {/* Welcome Section */}
      <div className="py-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          {user?.lastLoginAt ? 
            `Welcome back, ${authUser?.firstName || user?.firstName || "Climber"}!` : 
            `Welcome, ${authUser?.firstName || user?.firstName || "Climber"}!`
          }
        </h2>
        
        {/* Streak Section - Full Width */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-center space-x-2 text-gray-800">
            <span className="text-base font-medium">You're on a </span>
            <span className="text-2xl font-bold">{user?.currentStreak || 0}</span>
            <span className="text-base font-medium">-day streak!</span>

            {(user?.currentStreak || 0) >= 1 && (
              <span className="text-2xl animate-pulse">🔥</span>
            )}
          </div>
        </div>
      </div>

      {/* Log Climb CTA */}
      <Button
        onClick={() => setShowLogModal(true)}
        className="w-full bg-gradient-to-r from-[#CEE4D2] to-[#EF7326] hover:from-[#B8D4BE] hover:to-[#E5631A] text-gray-800 py-6 px-6 rounded-xl font-semibold text-lg mb-4 flex items-center justify-center space-x-2 shadow-lg"
      >
        <Plus className="w-5 h-5" />
        <span>Log Climb</span>
      </Button>

      {/* Today's Summary - Full Width */}
      <Card className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/30 mx-0">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Summary</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {summaryItems.map((item, index) => (
              <div key={index} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{item.label.replace(':', '')}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <LogClimbModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
      />
    </div>
  );
}
