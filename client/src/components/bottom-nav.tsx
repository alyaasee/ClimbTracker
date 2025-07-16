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
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
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
