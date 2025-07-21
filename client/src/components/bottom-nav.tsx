import { useLocation } from "wouter";
import { Home, List, BarChart3, Plus } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import LogClimbModal from "./log-climb-modal";

export default function BottomNav() {
  const [location] = useLocation();
  const [showLogModal, setShowLogModal] = useState(false);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/climb-log", icon: List, label: "Climb Log" },
    { href: "/stats", icon: BarChart3, label: "Stats" },
  ];

  return (
    <>
      <nav className="fixed bottom-4 left-3 right-3 aa-overlay-content backdrop-blur-lg border border-white/30 rounded-2xl shadow-lg">
        <div className="flex justify-around py-3 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl nav-transition flex-1 ${
                  isActive
                    ? "text-blue-600 bg-white/30 scale-105"
                    : "text-aa-medium hover:text-aa-dark hover:bg-white/20 hover:scale-102"
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Log Climb Button */}
          <button
            onClick={() => setShowLogModal(true)}
            className="flex flex-col items-center justify-center py-2 px-2 rounded-xl nav-transition flex-1 bg-gradient-to-r from-[#CEE4D2] to-[#EF7326] hover:from-[#B8D4BE] hover:to-[#E5631A] text-gray-800 hover:scale-102 shadow-md"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Log</span>
          </button>
        </div>
      </nav>
      
      <LogClimbModal 
        open={showLogModal} 
        onOpenChange={setShowLogModal} 
      />
    </>
  );
}
