import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios, { AxiosError } from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// ============ TYPE DEFINITIONS ============
interface ResetPasswordResponse {
  message: string;
}

interface ApiErrorResponse {
  message?: string;
}

// ============ COMPONENT ============
export default function ResetPassword() {
  // ✅ Simple type assertion - ye kaam karega
  const { token } = useParams() as { token: string };
  const navigate = useNavigate();
  
  // State with proper typing
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ============ HANDLE SUBMIT ============
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    // Validate token
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Typed API call
      const response = await axios.post<ResetPasswordResponse>(
        `${API_BASE}/auth/reset-password/${token}`, 
        { password }
      );
      
      // Success
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (err: unknown) {
      // Error handling
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        const status = err.response?.status;
        const errorMessage = err.response?.data?.message;
        
        switch (status) {
          case 400:
            setError(errorMessage || 'Invalid or expired reset token');
            break;
          case 404:
            setError('Reset token not found');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(errorMessage || 'Failed to reset password');
        }
      } else if (axios.isAxiosError(err) && err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };
  // ============ RENDER ============
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!success ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your new password below.
              </p>

              {/* Error Message with Animation */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
                >
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="text-sm font-medium mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input-fitness pl-12 pr-12"
                      disabled={isLoading}
                      required
                      minLength={6}
                      aria-label="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-medium mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="input-fitness pl-12"
                      disabled={isLoading}
                      required
                      minLength={6}
                      aria-label="Confirm password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  disabled={isLoading || !token}
                  aria-label={isLoading ? 'Resetting password...' : 'Reset password'}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            /* Success State */
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Password Reset! 🎉</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login...
              </p>
              
              {/* Progress Bar */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 max-w-xs mx-auto">
                <motion.div 
                  className="bg-primary h-1.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}