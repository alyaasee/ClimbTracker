import { useLocation } from "wouter";
import { Home, List, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/climb-log", icon: List, label: "Climb Log" },
    { href: "/stats", icon: BarChart3, label: "Stats" },
  ];

  return (
    <nav className="fixed bottom-4 left-3 right-3 bg-white/80 backdrop-blur-lg border border-white/30 rounded-2xl shadow-lg">
      <div className="flex justify-around py-3 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 flex-1 ${
                isActive
                  ? "text-blue-600 bg-white/30"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white/20"
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
