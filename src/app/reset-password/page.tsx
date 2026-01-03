'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { motion } from 'framer-motion';
import { validatePassword } from '@/services/authService';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const source = searchParams.get('source');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setStatus('error');
      setMessage(passwordErrors[0]); // Show first error
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setStatus('success');
      
      if (source === 'profile') {
        setMessage('Password updated successfully! Returning to profile...');
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] mb-6">
          Invalid or missing reset token.
        </div>
        <Link href="/forgot-password" className="text-[#8B5CF6] font-black hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'success' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-100 border-2 border-green-500 text-green-700 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]"
        >
          {message}
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]"
        >
          {message}
        </motion.div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
          New Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all outline-none text-lg font-medium"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all outline-none text-lg font-medium"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className="w-full py-4 bg-[#8B5CF6] text-white font-black text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7C3AED] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {status === 'loading' ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            UPDATING...
          </span>
        ) : 'RESET PASSWORD'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Create a new secure password."
      variant="login"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
