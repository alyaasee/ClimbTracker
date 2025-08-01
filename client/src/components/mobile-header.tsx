import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import type { AuthUserResponse } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import burgerIcon from "@assets/burger_877951_1752826463530.png";
import React from 'react';

export default function MobileHeader() {
  const [location, setLocation] = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  
  const { data: user } = useQuery<AuthUserResponse>({
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
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      // Clear React Query cache for authentication data
      await queryClient.invalidateQueries({ queryKey: ["api", "auth", "user"] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      // Clear all cached data
      queryClient.clear();
      // Force page reload to reset authentication state
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      // Force page reload even if logout fails to clear local state
      window.location.reload();
    }
  };

  const handleDropdownChange = (open: boolean) => {
    setProfileOpen(open);
  };

  return (
    <>
      {/* Navigation Header */}
      <header className="px-3 py-4 aa-overlay-content backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between">
          <DropdownMenu open={profileOpen} onOpenChange={handleDropdownChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 -ml-2">
                <img 
                  src={burgerIcon} 
                  alt="Menu" 
                  className="w-6 h-6"
                />
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
          {location === "/" || location === "/climb-log" || location === "/stats" ? (
            <div className="flex-1 flex justify-center">
              <div className="retro-container-primary px-6 py-2 rounded-lg">
                <div className="retro-title text-lg tracking-wider">
                  {location === "/" ? "HOME" : location === "/climb-log" ? "CLIMB LOG" : "CLIMBING STATS"}
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-semibold text-aa-dark flex-1 text-center header-title">{getTitle()}</h1>
          )}
          <div className="w-8"></div>
        </div>
      </header>
    </>
  );
}