
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
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 mx-3">
      <div className="retro-container bg-climb-mint border-4 border-climb-dark rounded-2xl shadow-2xl backdrop-blur-sm bg-opacity-95">
        <div className="flex justify-around items-center py-3 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all retro-bounce ${
                  isActive 
                    ? 'retro-container-accent text-climb-dark scale-105' 
                    : 'text-climb-dark hover:text-climb-orange hover:scale-105'
                }`}
              >
                <Icon size={20} strokeWidth={3} />
                <span className="retro-label mt-1 text-xs">{item.label}</span>
              </button>
            );
          })}
          
          {/* Log Climb Button */}
          <button
            onClick={onLogClimbClick}
            className="retro-button px-3 py-2 retro-bounce flex items-center hover:scale-105 transition-transform"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="retro-label ml-1 text-xs">Log</span>
          </button>
        </div>
      </div>
    </div>
  );
}
