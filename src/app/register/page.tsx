"use client";

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { validatePassword } from '../../services/authService';
import AuthLayout from '../../components/AuthLayout';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { register, loginWithGoogle, isLoading } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    
    const newErrors: string[] = [];
    
    // Validate all fields
    if (!formData.firstName.trim()) newErrors.push('First name is required');
    if (!formData.lastName.trim()) newErrors.push('Last name is required');
    if (!formData.email.trim()) newErrors.push('Email is required');
    if (!formData.password) newErrors.push('Password is required');
    if (!formData.confirmPassword) newErrors.push('Please confirm your password');
    if (!agreedToTerms) newErrors.push('You must agree to the terms and conditions');
    
    // Validate password
    if (formData.password) {
      const passwordErrors = validatePassword(formData.password);
      newErrors.push(...passwordErrors);
    }
    
    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await register({
        firstName: formData.firstName.trim(),        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      router.push('/upload');
    } catch (err: any) {
      setErrors([err.message || 'Registration failed']);
    }
  };

  const handleGoogleSignup = async () => {
    setErrors([]);
    
    if (!agreedToTerms) {
      setErrors(['You must agree to the terms and conditions to sign up']);
      return;
    }

    try {
      await loginWithGoogle();
      router.push('/upload');
    } catch (err: any) {
      setErrors([err.message || 'Google signup failed']);
    }
  };

  return (
    <AuthLayout 
      title="Create account" 
      subtitle="Start staging your properties for free."
      variant="register"
    >
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
          <ul className="text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
              First name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Last name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            placeholder="john@example.com"
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            placeholder="Create a password"
          />
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Confirm password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            placeholder="Confirm your password"
          />
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-center">
          <div 
            onClick={() => !isLoading && setAgreedToTerms(!agreedToTerms)}
            className={`relative w-14 h-8 rounded-full border-2 border-black cursor-pointer transition-colors duration-200 flex-shrink-0 ${
              agreedToTerms ? 'bg-[#8B5CF6]' : 'bg-gray-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div 
              className={`absolute top-1 left-1 w-5 h-5 rounded-full border-2 border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 ${
                agreedToTerms ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
          <label className="ml-3 block text-sm font-medium text-gray-700 select-none cursor-pointer" onClick={() => !isLoading && setAgreedToTerms(!agreedToTerms)}>
            I agree to the{' '}
            <Link href="/terms" className="font-bold text-[#8B5CF6] hover:text-[#7C3AED] hover:underline" onClick={(e) => e.stopPropagation()}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold text-[#8B5CF6] hover:text-[#7C3AED] hover:underline" onClick={(e) => e.stopPropagation()}>
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#8B5CF6] text-white font-black text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7C3AED] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#FFFCF5] text-gray-500 font-bold">OR</span>
        </div>
      </div>

      {/* Google Signup */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoading ? 'Please wait...' : 'Sign up with Google'}
      </button>

      {/* Sign In Link */}
      <p className="mt-8 text-center text-gray-600 font-medium">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#8B5CF6] hover:text-[#7C3AED] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
