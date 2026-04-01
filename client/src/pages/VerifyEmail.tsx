import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios, { AxiosError } from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// ============ TYPE DEFINITIONS ============
interface VerifyEmailResponse {
  message: string;
}

interface VerifyEmailErrorResponse {
  message?: string;
}

type VerificationStatus = 'loading' | 'success' | 'error';

// ============ COMPONENT ============
export default function VerifyEmail() {
  // Properly typed useParams
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async (): Promise<void> => {
      // Validate token exists
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification token');
        return;
      }

      try {
        // Typed API call
        const response = await axios.get<VerifyEmailResponse>(
          `${API_BASE}/auth/verify-email/${token}`
        );
        
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
        
      } catch (err: unknown) {
        setStatus('error');
        
        // Properly typed error handling (NO 'any')
        if (axios.isAxiosError<VerifyEmailErrorResponse>(err)) {
          // Axios error with our response type
          const errorMessage = err.response?.data?.message;
          
          // Handle different error scenarios
          if (err.response?.status === 400) {
            setMessage(errorMessage || 'Invalid or expired verification token');
          } else if (err.response?.status === 404) {
            setMessage('Verification token not found');
          } else if (err.code === 'ERR_NETWORK') {
            setMessage('Network error. Please check your connection.');
          } else {
            setMessage(errorMessage || 'Verification failed');
          }
          
          // Log for debugging (optional)
          console.debug('Verification error:', {
            status: err.response?.status,
            data: err.response?.data
          });
          
        } else if (err instanceof Error) {
          // Standard JavaScript error
          setMessage(err.message);
        } else {
          // Unknown error type
          setMessage('An unexpected error occurred');
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  // ============ RENDER ============
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Loading State */}
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/50 rounded-full" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifying Email</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email...
              </p>
            </motion.div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Email Verified! ✅</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              {/* Progress bar for redirect */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 max-w-xs mx-auto">
                <motion.div 
                  className="bg-primary h-1.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to login...
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              {/* Action buttons */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="btn-primary inline-block px-6 py-3 w-full sm:w-auto"
                >
                  Go to Login
                </Link>
                
                {/* Show resend option for expired tokens */}
                {message.includes('expired') && (
                  <Link
                    to="/resend-verification"
                    className="text-primary text-sm hover:underline block mt-3"
                  >
                    Resend verification email
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}