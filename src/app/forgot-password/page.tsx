'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setStatus('success');
      setMessage('If an account exists with this email, we sent a reset link.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <AuthLayout 
      title="Forgot Password?" 
      subtitle="Enter your email to reset your password."
      variant="login"
    >
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
          <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all outline-none text-lg font-medium"
            placeholder="name@example.com"
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
              SENDING...
            </span>
          ) : status === 'success' ? 'EMAIL SENT' : 'SEND RESET LINK'}
        </button>

        <div className="text-center">
          <Link href="/login" className="text-gray-600 font-bold hover:text-black hover:underline transition-colors">
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
