"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import AuthLayout from '../../components/AuthLayout';
import { motion } from 'framer-motion';

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [hasSentOnLoad, setHasSentOnLoad] = useState(false);

  useEffect(() => {
    // If no user, go to login
    if (!auth.currentUser) {
      router.push('/login');
      return;
    }

    // If already verified, go to upload
    if (auth.currentUser.emailVerified) {
      router.push('/upload');
    }
  }, [user, router]);

  // Auto-send code on load
  useEffect(() => {
    if (user && !user.emailVerified && !hasSentOnLoad) {
      handleResendCode();
      setHasSentOnLoad(true);
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!auth.currentUser || cooldown > 0) return;

    setSending(true);
    setMessage('');
    setError('');
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: auth.currentUser.email,
          userId: auth.currentUser.uid
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
           // Extract seconds from error message if possible, or default to 60
           const secondsMatch = data.error?.match(/(\d+) seconds/);
           const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60;
           setCooldown(seconds);
           // Silent return for rate limits - don't show error to user
           return;
        }
        throw new Error(data.error || 'Failed to send code');
      }

      setMessage('Verification code sent! Please check your inbox.');
      setCooldown(60); // 60 seconds cooldown to match backend
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setError(error.message || 'Failed to send verification code.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: auth.currentUser?.uid,
          code: fullCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Force token refresh to update emailVerified status in client
      await auth.currentUser?.reload();
      await auth.currentUser?.getIdToken(true);
      
      router.push('/upload');
    } catch (error: any) {
      console.error('Error verifying:', error);
      setError(error.message || 'Invalid code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthLayout 
      title="Verify Email" 
      subtitle="Check your inbox for the code."
      variant="verify"
    >
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#A3E635] border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium text-lg">
            We sent a 6-digit code to <br/>
            <span className="text-black font-black text-xl">{user?.email}</span>
          </p>
          <p className="text-gray-500 text-sm mt-4 font-medium bg-yellow-50 border border-yellow-200 rounded-lg p-2 inline-block">
            ⚠️ Email can sometimes take up to 5 minutes due to high traffic.
          </p>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-100 border-2 border-blue-500 text-blue-700 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] text-center"
          >
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] text-center"
          >
            {error}
          </motion.div>
        )}

        <div className="flex justify-center gap-2 sm:gap-3 mb-8">
          {code.map((digit, i) => (
            <motion.input
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              id={`code-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-3xl font-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all outline-none bg-white"
            />
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full py-4 bg-[#8B5CF6] text-white font-black text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7C3AED] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                VERIFYING...
              </span>
            ) : 'VERIFY ACCOUNT'}
          </button>

          <button
            onClick={handleResendCode}
            disabled={sending || cooldown > 0}
            className={`w-full py-3 bg-white text-gray-900 font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
              sending || cooldown > 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none translate-y-0'
                : ''
            }`}
          >
            {sending ? 'SENDING...' : cooldown > 0 ? `RESEND IN ${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}` : 'RESEND CODE'}
          </button>

          <button
            onClick={logout}
            className="w-full text-red-600 font-bold py-2 hover:underline text-sm uppercase tracking-wider"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
