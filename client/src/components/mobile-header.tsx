import { useLocation } from "wouter";
import { Menu } from "lucide-react";

export default function MobileHeader() {
  const [location] = useLocation();
  
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
          <button className="p-2 -ml-2">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{getTitle()}</h1>
          <div className="w-8"></div>
        </div>
      </header>
    </>
  );
}
