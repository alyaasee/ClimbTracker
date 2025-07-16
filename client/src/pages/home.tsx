import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Zap, Flame, Target, Plus } from "lucide-react";
import LogClimbModal from "@/components/log-climb-modal";

export default function Home() {
  const [showLogModal, setShowLogModal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/stats/today"],
  });

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
    <div className="py-2 px-0">
      {/* Welcome Section */}
      <div className="py-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {user?.lastLoginAt ? 
            `Welcome back, ${user.firstName || "Climber"}!` : 
            `Welcome, ${user.firstName || "Climber"}!`
          }
        </h2>
        
        {/* Streak Section - Full Width */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-center space-x-2 text-amber-700">
            <span className="text-base font-medium">You're on a </span>
            <span className="text-2xl font-bold">{user?.currentStreak || 0}</span>
            <span className="text-base font-medium">-day streak!</span>
            <span className="text-2xl">🔥</span>
          </div>
        </div>
      </div>

      {/* Log Climb CTA */}
      <Button
        onClick={() => setShowLogModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 px-6 rounded-xl font-semibold text-lg mb-4 flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Log Climb</span>
      </Button>

      {/* Today's Summary - Full Width */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-100 mx-0">
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
