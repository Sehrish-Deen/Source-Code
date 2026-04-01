import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Target,
  Edit2,
  Scale,
  Ruler,
  Award,
  Dumbbell,
  Flame,
  Upload
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getProfile, updateProfile, UserProfile } from '@/services/profileService';
import { getWorkouts, Workout } from '@/services/workoutService';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Profile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchWorkouts = async () => {
      try {
        const data = await getWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
    fetchWorkouts();
  }, []);

  if (!user) return null;

  return (
    <Layout>
      <ToastContainer position="top-right" autoClose={3000} />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Profile Header */}
        <motion.div variants={itemVariants} className="stat-card stat-card-primary p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-white/30"
              />
              <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="opacity-80 mt-1">{user.email}</p>
              <p className="text-sm opacity-70 mt-2">{user.goal}</p>
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <button className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <ProfileForm
                  user={user}
                  onClose={() => setIsEditModalOpen(false)}
                  onUpdated={(updatedUser) => {
                    setUser(updatedUser);
                    setIsEditModalOpen(false);
                    toast.success("Profile updated successfully");
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div variants={itemVariants} className="stat-card">
          <h2 className="section-title">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Info icon={<User className="w-5 h-5 text-muted-foreground" />} label="Full Name" value={user.username} />
            <Info icon={<Mail className="w-5 h-5 text-muted-foreground" />} label="Email" value={user.email} />
            <Info icon={<Scale className="w-5 h-5 text-muted-foreground" />} label="Current Weight" value={user.weight ? `${user.weight} kg` : ''} />
            <Info icon={<Ruler className="w-5 h-5 text-muted-foreground" />} label="Height" value={user.height ? `${user.height} cm` : ''} />
            <Info icon={<Calendar className="w-5 h-5 text-muted-foreground" />} label="Age" value={user.age ? `${user.age} years` : ''} />
            <Info
              icon={<Calendar className="w-5 h-5 text-muted-foreground" />}
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            />
          </div>
        </motion.div>

        {/* Fitness Goals */}
        <motion.div variants={itemVariants} className="stat-card">
          <h2 className="section-title">Fitness Goals</h2>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{user.goal}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function ProfileForm({
  user,
  onClose,
  onUpdated
}: {
  user: UserProfile;
  onClose: () => void;
  onUpdated: (u: UserProfile) => void;
}) {
  const [form, setForm] = useState<UserProfile>({ ...user });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, profilePicture: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure email is not changed by using the original user email
      const updatedForm = { ...form, email: user.email };
      const updated = await updateProfile(updatedForm);
      onUpdated(updated);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Profile Image */}
      <div className="flex justify-center mb-4">
        <label className="relative cursor-pointer group">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
            {form.profilePicture ? (
              <img src={form.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground">
            <Upload className="w-4 h-4" />
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      </div>

      {/* Full Name */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Full Name</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="input-fitness"
        />
      </div>

      {/* Email - Disabled */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Email</label>
        <input
          type="email"
          value={form.email}
          disabled
          className="input-fitness bg-gray-100 cursor-not-allowed opacity-75"
        />
        <p className="text-xs text-muted-foreground mt-1">Email is verified and cannot be changed</p>
      </div>

      {/* Weight, Height, Age */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Weight (kg)</label>
          <input
            type="number"
            value={form.weight || ''}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
            className="input-fitness"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Height (cm)</label>
          <input
            type="number"
            value={form.height || ''}
            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
            className="input-fitness"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Age</label>
          <input
            type="number"
            value={form.age || ''}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="input-fitness"
          />
        </div>
      </div>

      {/* Fitness Goal */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Fitness Goal</label>
        <textarea
          value={form.goal ?? ''}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          className="input-fitness min-h-[80px] resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          Save Changes
        </button>
      </div>
    </form>
  );
}