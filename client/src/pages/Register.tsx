import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Activity,
  ArrowRight,
  User,
  Upload,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// ✅ Updated Regex: alphabets and spaces allowed
const USERNAME_REGEX = /^[A-Za-z\s]+$/;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // ✅ Loading state for auth check
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Loading state for form submission
  const navigate = useNavigate();

  // ✅ Cookie-based already-login check with loading
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        await axios.get(`${API_BASE}/auth/me`, { withCredentials: true });
        navigate('/'); // already logged in → redirect to home
      } catch {
        // not logged in → stay on page
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ✅ Loading spinner component (same as Login)
  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* Inner spinning ring */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium">Checking authentication...</p>
      </div>
    </div>
  );

  // ✅ Agar auth check chal raha hai to loading spinner dikhao
  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true); // ✅ Start submission loading

    // ✅ Frontend validation
    if (!username || !email || !password) {
      setError('Username, email, and password are required.');
      setIsSubmitting(false);
      return;
    }
    
    // ✅ Trim username for validation (remove extra spaces)
    const trimmedUsername = username.trim();
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setError('Username can contain only alphabets and spaces.');
      setIsSubmitting(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/auth/register`,
        { 
          username: trimmedUsername, // ✅ Send trimmed username
          email, 
          password, 
          profilePicture: profileImage ?? '' 
        },
        { withCredentials: true } // cookie-based auth
      );

      // ✅ Show success message on same page
      setSuccessMessage(response.data.message || '✅ Registered successfully! Redirecting to login...');
      setUsername('');
      setEmail('');
      setPassword('');
      setProfileImage(null);
      
      // ✅ Redirect to login page after 2 seconds (not to dashboard)
      setTimeout(() => navigate('/login'), 2000);
      
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data?.message || 'Something went wrong.');
      } else {
        setError('Something went wrong.');
      }
      setIsSubmitting(false); // ✅ Stop loading on error
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative text-white text-center">
          <h2 className="text-4xl font-bold font-display mb-4">Start Your Journey</h2>
          <p className="text-xl opacity-80 max-w-md">
            Create your account and begin transforming your fitness today
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-6"
        >
          <motion.div variants={itemVariants} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-display">Create Account</h1>
            <p className="text-muted-foreground mt-2">
              Join FitTrack and start your fitness journey
            </p>
          </motion.div>

          {/* Error / Success messages with animation */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-600 text-sm text-center">{error}</p>
            </motion.div>
          )}
          
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-green-600 text-sm text-center font-medium">{successMessage}</p>
              <div className="mt-2 flex justify-center">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </motion.div>
          )}

          <motion.form
            variants={itemVariants}
            className="space-y-4"
            onSubmit={handleRegister}
          >
            {/* Profile Picture */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground">
                  <Upload className="w-4 h-4" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden"
                  disabled={isSubmitting || !!successMessage}
                />
              </label>
            </div>

            {/* Username - Now with space support */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow alphabets and spaces
                    if (/^[A-Za-z\s]*$/.test(value) || value === '') setUsername(value);
                  }}
                  placeholder="Enter your full name"
                  className="input-fitness pl-12"
                  disabled={isSubmitting || !!successMessage}
                  required
                />
              </div>
             
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-fitness pl-12"
                  disabled={isSubmitting || !!successMessage}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  className="input-fitness pl-12 pr-12"
                  disabled={isSubmitting || !!successMessage}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSubmitting || !!successMessage}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
                disabled={isSubmitting || !!successMessage}
                required
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </span>
            </div>

            <button 
              type="submit" 
              className={`btn-primary w-full flex justify-center items-center gap-2 ${
                (isSubmitting || successMessage) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting || !!successMessage}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : successMessage ? (
                <>
                  <span>✓ Registered Successfully!</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.form>

          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}