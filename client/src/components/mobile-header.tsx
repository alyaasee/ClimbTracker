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
  const [location] = useLocation();
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-white text-black text-sm font-medium">
        <span>11:41</span>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-2 bg-black rounded-sm"></div>
          <div className="w-4 h-2 bg-black rounded-sm"></div>
          <div className="w-4 h-2 bg-black rounded-sm"></div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="px-4 py-4 bg-white border-b border-gray-100">
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
              <DropdownMenuItem className="flex items-center space-x-3 p-3 cursor-pointer">
                <User className="w-4 h-4 text-gray-500" />
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
          <h1 className="text-lg font-semibold text-gray-900">{getTitle()}</h1>
          <div className="w-8"></div>
        </div>
      </header>
    </>
  );
}
