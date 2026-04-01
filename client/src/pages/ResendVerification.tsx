import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// Define types for better type safety
interface LocationState {
  email?: string;
}

interface ApiErrorResponse {
  message?: string;
}

interface ResendVerificationResponse {
  message: string;
}

export default function ResendVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Get email from navigation state (if coming from login page)
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location.state]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Validation
    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post<ResendVerificationResponse>(
        `${API_BASE}/auth/resend-verification`, 
        { email }
      );
      
      setSuccessMessage(response.data.message || 'Verification email sent successfully!');
      setIsSubmitted(true);
      setCountdown(60); // 60 seconds cooldown
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err: unknown) {
      // Properly typed error handling
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        // Axios error with our response type
        const errorMessage = err.response?.data?.message;
        setError(errorMessage || 'Failed to resend verification email');
        
        // Log error for debugging (optional)
        console.error('Resend verification error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        });
      } else if (err instanceof Error) {
        // Generic JavaScript error
        setError(err.message);
      } else {
        // Unknown error type
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back button */}
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Resend Verification Email</h1>
            <p className="text-muted-foreground mt-2">
              Enter your email address and we'll send you a new verification link
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-600 text-sm font-medium">{successMessage}</p>
                <p className="text-green-600 text-xs mt-1">
                  Please check your inbox and spam folder
                </p>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          {!successMessage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note:</span> The verification link will expire after 24 hours. 
                If you don't see the email in your inbox, please check your spam folder.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-fitness pl-12"
                  disabled={isLoading || countdown > 0}
                  required
                  aria-label="Email address"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary w-full flex items-center justify-center gap-2 ${
                (isLoading || countdown > 0) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || countdown > 0}
              aria-label={isLoading ? 'Sending...' : countdown > 0 ? `Resend available in ${countdown}s` : 'Send verification email'}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading"></div>
                  <span>Sending...</span>
                </>
              ) : countdown > 0 ? (
                <>
                  <span>Resend available in {countdown}s</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Verification Email</span>
                </>
              )}
            </button>
          </form>

          {/* Already verified? */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already verified?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Need help? */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Still having trouble?{' '}
              <Link to="/contact" className="text-primary hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200"
        >
          <h3 className="text-sm font-semibold mb-2">Why verify your email?</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Secure your account from unauthorized access</li>
            <li>• Receive important updates about your fitness journey</li>
            <li>• Get personalized workout recommendations</li>
            <li>• Recover your account if you forget your password</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}