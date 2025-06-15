"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavLink from './NavLink';
import Button from './Button';
import AuthButton from './AuthButton';
import { useAuth } from '../contexts/AuthContext';
import { useUploadLimit } from '../hooks/useUploadLimit';
import { getCurrentPlan } from '../services/pricingService';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout, user, userData } = useAuth();
  const { remainingUploads, totalUploads, isLimitReached, isLoading, userTier } = useUploadLimit();
  
  // Get current plan details
  const currentPlan = getCurrentPlan(userTier);
  
  const handleUpgradeClick = () => {
    // Scroll to pricing section on homepage
    if (window.location.pathname === '/') {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to homepage pricing section
      window.location.href = '/#pricing';
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'bg-white/70 backdrop-blur-md border-b border-gray-200 px-6 py-4' 
        : 'bg-transparent border-b border-transparent px-12 py-8'
    }`}>{/* Logo */}
      <Link href="/" className="flex items-center gap-3 mr-8 hover:opacity-80 transition-opacity">
        <img 
          src="/logo.png" 
          alt="AI Staging App Logo" 
          className="w-12 h-12 object-contain"
        />
        <span className="text-gray-900 font-bold text-xl tracking-wide">
          AI Staging App
        </span>
      </Link>      {/* Navigation Links */}
      <nav className="hidden md:flex items-center space-x-12">
        <NavLink href="#features">Gallery</NavLink>
        <NavLink href="/upload">Upload</NavLink>
        <NavLink href="#pricing">Pricing</NavLink>
        <NavLink href="#faq">FAQ</NavLink>
      </nav>
      {/* Mobile Menu Button */}
      <button className="md:hidden text-gray-900 p-3 ml-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />        </svg>
      </button>      {/* Right side buttons */}
      <div className="hidden md:flex items-center gap-4 ml-8">        {isAuthenticated ? (
          <>
            <Link 
              href="/upload"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Upload
            </Link>
            
            {/* Plan Display */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  userTier === 'free' ? 'bg-gray-400' : 
                  userTier === 'basic' ? 'bg-yellow-400' : 'bg-purple-400'
                }`}></div>
                <span className="text-sm font-medium text-blue-700">
                  {isLoading ? '...' : currentPlan.name}
                </span>
              </div>
            </div>

            {/* Upgrade Button - Only show for free tier */}
            {userTier === 'free' && (
              <button 
                onClick={handleUpgradeClick}
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-semibold rounded-full hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-sm"
              >
                Upgrade
              </button>
            )}
            
            {/* Upload Limit Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 border">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                </svg>
                <span className={`text-sm font-medium ${isLimitReached ? 'text-red-600' : 'text-gray-700'}`}>
                  {isLoading ? '...' : `${remainingUploads}/${totalUploads}`}
                </span>
              </div>
              {isLimitReached && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <span className="text-gray-600 text-sm">
              Hello, {userData?.firstName || user?.displayName?.split(' ')[0] || 'User'}
            </span>
            <button
              onClick={logout}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button></>
        ) : (
          <>
            <Link 
              href="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
