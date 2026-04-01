import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  BarChart3,
  User,
  Settings,
  Bell,
  FileText,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetClose } from '@/components/ui/sheet';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Dumbbell, label: 'Workouts', path: '/workouts' },
  { icon: Utensils, label: 'Nutrition', path: '/nutrition' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function MobileMenu() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
          <Activity className="w-6 h-6" />
        </div>
        <span className="font-display font-bold text-xl">FitTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <SheetClose asChild key={item.path}>
              <Link
                to={item.path}
                className={cn('nav-item', isActive && 'nav-item-active')}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </SheetClose>
          );
        })}
      </nav>
    </div>
  );
}
