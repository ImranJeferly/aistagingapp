"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  defaultTab?: any; 
}

export default function AuthModal({ isOpen, onClose, message }: AuthModalProps) {
  const { loginWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  // if (!isOpen) return null; // AnimatePresence handles mounting

  const handleGoogleLogin = async () => {
    setError('');
    if (!agreed) {
        setError("Please accept the Terms & Privacy Policy to continue.");
        return;
    }
    
    try {
      await loginWithGoogle();
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  };

  const handleEmailRedirect = () => {
     if (!agreed) {
        setError("Please accept the Terms & Privacy Policy to continue.");
        return;
    }
    router.push('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80" // Removed backdrop-blur for performance
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 text-center space-y-6">
              <div className="mt-2">
                <div className="w-16 h-16 bg-[#FFF4C3] rounded-full flex items-center justify-center mx-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black font-brand text-gray-900 leading-tight">
                    {message || "Limit Reached"}
                </h2>
                <p className="text-gray-600 mt-2 font-medium">
                    Sign in to continue creating amazing staged images.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={handleEmailRedirect}
                    disabled={isLoading}
                    className="w-full py-3 bg-[#8B5CF6] text-white font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7C3AED] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue with Email
                  </button>
              </div>

              <div className="text-left">
                <label className="flex items-start gap-4 cursor-pointer group bg-[#FFFCF5] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"> 
                    <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox" 
                          className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-black bg-white transition-all checked:bg-black checked:border-black"
                          checked={agreed}
                          onChange={(e) => {
                              setAgreed(e.target.checked);
                              if(e.target.checked) setError('');
                          }}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 leading-snug">
                        I agree to the <a href="/terms" className="underline hover:text-[#8B5CF6] decoration-2">Terms of Service</a> and <a href="/privacy" className="underline hover:text-[#8B5CF6] decoration-2">Privacy Policy</a>
                    </span>
                </label>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

