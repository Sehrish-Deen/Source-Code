import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Dumbbell, label: 'Workouts', path: '/workouts' },
  { icon: Utensils, label: 'Nutrition', path: '/nutrition' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'bottom-nav-item flex-1',
                isActive && 'bottom-nav-item-active'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              <span className={cn(isActive && 'font-semibold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
