import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from "axios";
import { 
  Settings as SettingsIcon, 
  Bell, 
  User,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Settings() {
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // User data
  const [user, setUser] = useState({
    username: '',
    email: '',
    profilePicture: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: true,
    goalAchievements: true,
    weeklyReport: true,
  });

  // Error state
  const [error, setError] = useState('');

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Fetch user settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(
        "http://localhost:3000/api/v1/settings",
        { withCredentials: true }
      );
      
      console.log("Settings fetched:", response.data);
      
      if (response.data.success) {
        // Update user data
        setUser({
          username: response.data.data.username || '',
          email: response.data.data.email || '',
          profilePicture: response.data.data.profilePicture || ''
        });
        
        // Update notification settings
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setError('Failed to load settings. Please try again.');
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle notification toggle
  const handleNotificationChange = async (key, checked) => {
    // Update UI immediately for better UX
    const updatedNotifications = { ...notifications, [key]: checked };
    setNotifications(updatedNotifications);
    
    // Clear any previous success message
    setSaveSuccess(false);
    
    try {
      setSaving(true);
      
      const response = await axios.put(
        "http://localhost:3000/api/v1/settings/notifications",
        updatedNotifications,
        { withCredentials: true }
      );
      
      console.log("Settings updated:", response.data);
      
      // Show success message
      setSaveSuccess(true);
      toast.success("Settings updated successfully!");
      
    } catch (error) {
      console.error("Failed to update settings:", error);
      
      // Revert on error
      setNotifications({ ...notifications, [key]: !checked });
      
      // Show error message
      toast.error(error.response?.data?.errorMessage || "Failed to update settings");
      
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setSaving(true);
      
      await axios.post(
        "http://localhost:3000/api/v1/auth/logout",
        {},
        { withCredentials: true }
      );
      
      toast.success("Logged out successfully");
      window.location.href = "/login";
      
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Logout failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">Something went wrong</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchSettings}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-2xl mx-auto pb-8"
      >
        {/* Header with Status */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-description">Manage your preferences</p>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {saveSuccess && !saving && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Saved!</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* User Info Card (Optional) */}
        <motion.div variants={itemVariants} className="stat-card bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{user.username || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Link 
              to="/profile" 
              className="text-sm text-primary hover:underline"
            >
              Edit Profile
            </Link>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {/* Workout Reminders */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Workout Reminders</p>
                <p className="text-sm text-muted-foreground">Get reminded about scheduled workouts</p>
              </div>
              <Switch
                checked={notifications.workoutReminders}
                onCheckedChange={(checked) => handleNotificationChange('workoutReminders', checked)}
                disabled={saving}
                className={saving ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </div>

            {/* Meal Reminders */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Meal Reminders</p>
                <p className="text-sm text-muted-foreground">Remind me to log my meals</p>
              </div>
              <Switch
                checked={notifications.mealReminders}
                onCheckedChange={(checked) => handleNotificationChange('mealReminders', checked)}
                disabled={saving}
                className={saving ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </div>

            {/* Goal Achievements */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Goal Achievements</p>
                <p className="text-sm text-muted-foreground">Celebrate when I hit my goals</p>
              </div>
              <Switch
                checked={notifications.goalAchievements}
                onCheckedChange={(checked) => handleNotificationChange('goalAchievements', checked)}
                disabled={saving}
                className={saving ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </div>

            {/* Weekly Report */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Weekly Report</p>
                <p className="text-sm text-muted-foreground">Send weekly fitness summary</p>
              </div>
              <Switch
                checked={notifications.weeklyReport}
                onCheckedChange={(checked) => handleNotificationChange('weeklyReport', checked)}
                disabled={saving}
                className={saving ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </div>
          </div>
        </motion.div>

        {/* Account Links */}
        <motion.div variants={itemVariants} className="stat-card p-0 overflow-hidden">
          <Link 
            to="/profile" 
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium">Account Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          
       
          
        
        </motion.div>

        {/* Logout Button */}
        <motion.div variants={itemVariants}>
          <button
            onClick={handleLogout}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <span className="font-medium">
              {saving ? 'Logging out...' : 'Log Out'}
            </span>
          </button>
        </motion.div>

        {/* Version Info */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-xs text-muted-foreground">
            Version 1.0.0 • © 2026 Fitness App
          </p>
        </motion.div>
      </motion.div>
    </Layout>
  );
}