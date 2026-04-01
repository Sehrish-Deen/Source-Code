import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  Trophy, 
  Clock, 
  Info,
  Trash2,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Types - Proper interface without 'any'
interface NotificationMetadata {
  workoutId?: string;
  mealId?: string;
  goalId?: string;
  actionUrl?: string;
}

interface Notification {
  _id: string;
  type: 'reminder' | 'achievement' | 'info';
  title: string;
  message: string;
  read: boolean;
  metadata?: NotificationMetadata;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const notificationIcons = {
  reminder: Clock,
  achievement: Trophy,
  info: Info,
};

const notificationColors = {
  reminder: 'bg-primary/10 text-primary',
  achievement: 'bg-warning/10 text-warning',
  info: 'bg-muted text-muted-foreground',
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notifications`, {
        withCredentials: true // For cookies
      });
      
      setNotificationList(response.data.data);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/markAsRead/${id}`, {}, {
        withCredentials: true
      });
      
      // Update local state
      setNotificationList(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Mark as read error:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API_URL}/markAllAsRead`, {}, {
        withCredentials: true
      });
      
      // Update local state
      setNotificationList(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/deleteNotification/${id}`, {
        withCredentials: true
      });
      
      // Update local state
      const deletedItem = notificationList.find(n => n._id === id);
      setNotificationList(prev => prev.filter(n => n._id !== id));
      
      // Update unread count if deleted item was unread
      if (deletedItem && !deletedItem.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Failed to delete notification');
    }
  };

  const clearReadNotifications = async () => {
    try {
      await axios.delete(`${API_URL}/clearReadNotifications`, {
        withCredentials: true
      });
      
      // Remove all read notifications from local state
      setNotificationList(prev => prev.filter(n => !n.read));
      
      toast.success('Read notifications cleared');
    } catch (error) {
      console.error('Clear read notifications error:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Format date to relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer position="top-right" autoClose={2000} />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-2xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-description">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` 
                : notificationList.length > 0 
                  ? 'All caught up!' 
                  : 'No notifications'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {notificationList.some(n => n.read) && (
              <button
                onClick={clearReadNotifications}
                className="btn-outline text-sm px-4 py-2"
                title="Clear read notifications"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear read</span>
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn-outline text-sm px-4 py-2"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {notificationList.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notificationList.map((notification) => {
              const Icon = notificationIcons[notification.type];
              return (
                <motion.div
                  key={notification._id}
                  variants={itemVariants}
                  className={cn(
                    "stat-card relative group cursor-pointer transition-all",
                    !notification.read && "ring-2 ring-primary/20 bg-primary/5"
                  )}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl flex-shrink-0",
                      notificationColors[notification.type]
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
}