
import { Home, FileText, BarChart3, Plus } from 'lucide-react';
import { useLocation } from 'wouter';

interface BottomNavProps {
  onLogClimbClick: () => void;
}

export default function BottomNav({ onLogClimbClick }: BottomNavProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', color: 'text-climb-mint' },
    { icon: FileText, label: 'Log', path: '/climb-log', color: 'text-climb-blue' },
    { icon: BarChart3, label: 'Stats', path: '/stats', color: 'text-climb-mint' },
  ];

  return (
    <div className="retro-container bg-climb-mint border-t-4 border-climb-dark">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all retro-bounce ${
                isActive 
                  ? 'retro-container-accent text-climb-dark' 
                  : 'text-climb-dark hover:text-climb-orange'
              }`}
            >
              <Icon size={24} strokeWidth={3} />
              <span className="retro-label mt-1">{item.label}</span>
            </button>
          );
        })}
        
        {/* Log Climb Button */}
        <button
          onClick={onLogClimbClick}
          className="retro-button px-4 py-3 retro-bounce flex items-center"
        >
          <Plus size={24} strokeWidth={3} />
          <span className="retro-label ml-1">Log</span>
        </button>
      </div>
    </div>
  );
}
