import { Link } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileMenu } from './MobileMenu';
import { getProfile, UserProfile } from '@/services/profileService';
import axios from 'axios';
import { toast } from 'sonner';

// Notification Metadata Types
interface NotificationMetadata {
  workoutId?: string;
  mealId?: string;
  workoutName?: string;
  mealType?: string;
  streak?: number;
  goal?: number;
  date?: string;
  reminderType?: string;
  notificationType?: string;
  week?: string;
  goalType?: string;
  calories?: number;
  duration?: number;
  category?: string;
  workoutCount?: number;
  workouts?: Array<{ id: string; name: string }>;
}

// Notification type
interface Notification {
  _id: string;
  type: 'reminder' | 'achievement' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: NotificationMetadata;  // ✅ Properly typed, no 'any'
}

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // Fetch unread count from API
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/v1/notifications/unread-count",
        { withCredentials: true }
      );
      
      if (response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch recent notifications for preview
  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/v1/notifications?limit=5&read=false",
        { withCredentials: true }
      );
      
      if (response.data) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/v1/markAsRead/${id}`,
        {},
        { withCredentials: true }
      );
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.patch(
        "http://localhost:3000/api/v1/markAllAsRead",
        {},
        { withCredentials: true }
      );
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications marked as read");
      
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Navigate based on notification metadata
    const metadata = notification.metadata;
    
    if (metadata?.workoutId) {
      window.location.href = `/workout/${metadata.workoutId}`;
    } else if (metadata?.mealId) {
      window.location.href = `/nutrition/${metadata.mealId}`;
    } else {
      window.location.href = '/notifications';
    }
    
    setShowNotifications(false);
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'achievement':
        return '🏆';
      case 'reminder':
        return '⏰';
      default:
        return '📌';
    }
  };

  // Get notification link based on metadata
  const getNotificationLink = (notification: Notification): string => {
    const metadata = notification.metadata;
    if (metadata?.workoutId) {
      return `/workout/${metadata.workoutId}`;
    } else if (metadata?.mealId) {
      return `/nutrition/${metadata.mealId}`;
    }
    return '/notifications';
  };

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <MobileMenu />
            </SheetContent>
          </Sheet>

        
       
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell with Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  fetchRecentNotifications();
                }
              }}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-50"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-slide-in-up">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <Link
                        to="/notifications"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all
                      </Link>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const metadata = notification.metadata;
                        return (
                          <button
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm mb-1">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </p>
                                {/* Show metadata preview if exists */}
                                {metadata?.workoutName && (
                                  <p className="text-xs text-primary mt-1">
                                    🏋️ {metadata.workoutName}
                                  </p>
                                )}
                                {metadata?.mealType && (
                                  <p className="text-xs text-primary mt-1">
                                    🍽️ {metadata.mealType}
                                  </p>
                                )}
                                {metadata?.streak && (
                                  <p className="text-xs text-primary mt-1">
                                    🔥 {metadata.streak} day streak!
                                  </p>
                                )}
                              </div>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">No new notifications</p>
                        {unreadCount === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            All caught up! 🎉
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-border bg-muted/30">
                      <Link
                        to="/notifications"
                        className="block text-center text-sm text-primary hover:underline py-1"
                        onClick={() => setShowNotifications(false)}
                      >
                        See all notifications
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile Link */}
          <Link to="/profile" className="flex items-center gap-3">
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt={user?.username || 'User'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium leading-tight">{user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground">View Profile</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}