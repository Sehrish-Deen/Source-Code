import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Activity, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// ============ TYPE DEFINITIONS ============
interface LoginResponse {
  message: string;
  user: {
    _id: string;
    username: string;
    email: string;
    profilePicture: string;
    isEmailVerified: boolean;
  };
}

interface LoginErrorResponse {
  message?: string;
  needsVerification?: boolean;
  email?: string;
}

interface ResendVerificationResponse {
  message: string;
}

interface ResendErrorResponse {
  message?: string;
}

// ============ COMPONENT ============
export default function Login() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [showResendOption, setShowResendOption] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        await axios.get(`${API_BASE}/auth/me`, { withCredentials: true });
        navigate('/');
      } catch {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Handle login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setShowResendOption(false);
    setUnverifiedEmail(null);
    setIsSubmitting(true);

    // Frontend validation
    if (!email || !password) {
      setError('Email and password are required.');
      setIsSubmitting(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email.');
      setIsSubmitting(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      setSuccessMessage(response.data.message || 'Logged in successfully!');
      setEmail('');
      setPassword('');
      
      setTimeout(() => navigate('/'), 1500);
      
    } catch (err: unknown) {
      // Properly typed error handling
      if (axios.isAxiosError<LoginErrorResponse>(err)) {
        const errorData = err.response?.data;
        
        // Handle unverified email case
        if (errorData?.needsVerification) {
          setUnverifiedEmail(errorData.email || email);
          setShowResendOption(true);
          setError(
            <div className="space-y-3">
              <p className="text-red-600 text-sm">{errorData.message}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    console.log('Button clicked, email:', errorData.email || email);
                    handleResendVerification();
                  }}
                  disabled={isResending}
                  className="text-primary text-sm hover:underline font-medium inline-flex items-center gap-1 justify-center"
                >
                  {isResending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Click here to resend verification email'
                  )}
                </button>
                <Link
                  to="/resend-verification"
                  state={{ email: errorData.email || email }}
                  className="text-primary text-sm hover:underline font-medium inline-flex items-center gap-1 justify-center"
                >
                  Or go to resend page
                </Link>
              </div>
            </div>
          );
        } else {
          setError(errorData?.message || 'Login failed.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async (): Promise<void> => {
    console.log('1️⃣ handleResendVerification started', { unverifiedEmail });
    
    if (!unverifiedEmail) {
      console.log('2️⃣ No unverified email');
      setError('Email not found. Please try logging in again.');
      return;
    }
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      console.log('3️⃣ Making API call to:', `${API_BASE}/auth/resend-verification`);
      console.log('4️⃣ Request body:', { email: unverifiedEmail });
      
      const response = await axios.post<ResendVerificationResponse>(
        `${API_BASE}/auth/resend-verification`,
        { email: unverifiedEmail }
      );
      
      console.log('5️⃣ Response received:', response.data);
      
      setResendMessage('Verification email sent! Please check your inbox.');
      setTimeout(() => setResendMessage(''), 5000);
      
    } catch (err: unknown) {
      console.log('6️⃣ Error occurred:', err);
      
      let errorMessage = 'Failed to resend email. ';
      
      if (axios.isAxiosError<ResendErrorResponse>(err)) {
        console.log('7️⃣ Error response:', err.response?.data);
        console.log('8️⃣ Error status:', err.response?.status);
        
        if (err.code === 'ERR_NETWORK') {
          errorMessage += 'Network error - please check if backend server is running.';
        } else if (err.response?.status === 404) {
          errorMessage += 'User not found.';
        } else if (err.response?.status === 400) {
          errorMessage += err.response?.data?.message || 'Email already verified.';
        } else {
          errorMessage += err.response?.data?.message || 'Please try again.';
        }
        
        // If email is already verified, redirect to login
        if (err.response?.status === 400 && err.response?.data?.message?.includes('already verified')) {
          setTimeout(() => navigate('/login'), 3000);
        }
      } else if (err instanceof Error) {
        errorMessage += err.message;
      } else {
        errorMessage += 'An unexpected error occurred';
      }
      
      setResendMessage(errorMessage);
    } finally {
      console.log('9️⃣ Finally block');
      setIsResending(false);
    }
  };

  // Loading spinner component
  const LoadingSpinner = (): JSX.Element => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium">Checking authentication...</p>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md space-y-8">
          <motion.div variants={itemVariants} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-display">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to continue your fitness journey</p>
          </motion.div>

          {/* Error / Success messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              {typeof error === 'string' ? (
                <p className="text-red-600 text-sm text-center">{error}</p>
              ) : (
                error
              )}
            </motion.div>
          )}
          
          {/* Resend confirmation message */}
          {resendMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                resendMessage.includes('success') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <p className={`text-sm text-center ${
                resendMessage.includes('success') 
                  ? 'text-green-600' 
                  : 'text-blue-600'
              }`}>{resendMessage}</p>
            </motion.div>
          )}
          
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-green-600 text-sm text-center">{successMessage}</p>
            </motion.div>
          )}

          <motion.form variants={itemVariants} className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="input-fitness pl-12"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  disabled={isSubmitting || !!successMessage}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input-fitness pl-12 pr-12"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  disabled={isSubmitting || !!successMessage}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSubmitting || !!successMessage}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className={`btn-primary w-full flex items-center justify-center gap-2 ${
                (isSubmitting || successMessage) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting || !!successMessage}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.form>

          {/* Register Link */}
          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up for free
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative text-white text-center">
          <h2 className="text-4xl font-bold font-display mb-4">Track Your Progress</h2>
          <p className="text-xl opacity-80 max-w-md">Join thousands of fitness enthusiasts achieving their goals with FitTrack</p>
        </div>
      </div>
    </div>
  );
}