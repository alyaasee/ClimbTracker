import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, User, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileHeader() {
  const [location, setLocation] = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ["api", "auth", "user"],
  });

  const getTitle = () => {
    switch (location) {
      case "/":
        return "Home";
      case "/climb-log":
        return "Climb Log";
      case "/stats":
        return "Stats";
      default:
        return "Home";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout");
      // Clear any cached data and redirect to login
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-black text-sm font-medium">
        <span>11:41</span>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-2 bg-black rounded-sm"></div>
          <div className="w-4 h-2 bg-black rounded-sm"></div>
          <div className="w-4 h-2 bg-black rounded-sm"></div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between">
          <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 -ml-2">
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Profile</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setLocation("/profile")}
                className="flex items-center space-x-3 p-3 cursor-pointer"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.firstName || "User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.email || "user@example.com"}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center space-x-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <h1 className="text-lg font-semibold gradient-text flex-1 text-center">{getTitle()}</h1>
          <div className="w-8"></div>
        </div>
      </header>
    </>
  );
}
