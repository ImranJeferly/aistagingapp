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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, userData, isLoading: authLoading } = useAuth();
  const { remainingUploads, totalUploads, isLimitReached, isLoading, userTier } = useUploadLimit();
  
  // Get current plan details
  const currentPlan = getCurrentPlan(userTier);  const handleUpgradeClick = async () => {
    // Check if auth is still loading
    if (authLoading) {
      console.log('Authentication still loading, please wait...');
      return;
    }

    if (!isAuthenticated || !user || !user.uid) {
      // If not authenticated, redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      // Get the Basic plan details (recommended upgrade)
      const basicPlan = getCurrentPlan('basic');
      
      if (!basicPlan.paymentLink) {
        console.error('Payment link not configured for Basic plan');
        // Fallback to pricing section
        window.location.href = '/#pricing';
        return;
      }

      // Prefill email in payment link
      const paymentUrl = new URL(basicPlan.paymentLink);
      if (user.email) {
        paymentUrl.searchParams.set('prefilled_email', user.email);
      }

      console.log('Redirecting to payment link for user:', user.uid, 'plan: basic');
      // Redirect directly to Stripe Payment Link
      window.location.href = paymentUrl.toString();
    } catch (error) {
      console.error('Payment redirect error:', error);
      // Fallback to pricing section on error
      window.location.href = '/#pricing';
    }
  };useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleEscape);
    
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);return (
    <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'bg-white/70 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4' 
        : 'bg-transparent border-b border-transparent px-4 sm:px-8 md:px-12 py-6 sm:py-8'
    }`}>      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity relative z-[60]">
        <img 
          src="/logo.png" 
          alt="AI Staging App Logo" 
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />
        <span className="text-gray-900 font-bold text-lg sm:text-xl tracking-wide">
          AI Staging App
        </span>
      </Link>      {/* Desktop Navigation Links */}
      <nav className="hidden lg:flex items-center space-x-8 xl:space-x-12">
        <NavLink href="/features">Features</NavLink>
        <NavLink href="/upload">Upload</NavLink>
        <NavLink href="/pricing">Pricing</NavLink>
        <NavLink href="#faq">FAQ</NavLink>
      </nav>

      {/* Desktop Right side buttons */}
      <div className="hidden lg:flex items-center gap-2 ml-8">
        {isAuthenticated ? (
          <>
            <Link 
              href="/upload"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-sm"
            >
              Upload
            </Link>
            
            {/* Combined Plan and Limit Display for Free Users */}
            {userTier === 'free' ? (
              <div className="flex items-center gap-2">
                {/* Compact Plan + Limit Display */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-xs font-medium text-gray-600">Free</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                    </svg>
                    <span className={`text-xs font-medium ${isLimitReached ? 'text-red-600' : 'text-gray-600'}`}>
                      {isLoading ? '...' : `${remainingUploads}/${totalUploads}`}
                    </span>
                    {isLimitReached && (
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-1"></div>
                    )}
                  </div>
                </div>
                
                {/* Upgrade Button */}
                <button 
                  onClick={handleUpgradeClick}
                  className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-semibold rounded-full hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-xs"
                >
                  Upgrade
                </button>
              </div>
            ) : (
              <>
                {/* Separate displays for paid plans */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      userTier === 'basic' ? 'bg-yellow-400' : 'bg-purple-400'
                    }`}></div>
                    <span className="text-sm font-medium text-blue-700">
                      {isLoading ? '...' : currentPlan.name}
                    </span>
                  </div>
                </div>
                
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
              </>
            )}
            
            {/* Compact User Menu */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">
                {userData?.firstName || user?.displayName?.split(' ')[0] || 'User'}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div></>
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
          </>        )}
      </div>      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden text-gray-900 p-2 ml-2 relative z-[60]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>      {/* Mobile Menu Overlay - White with blur effect */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[998] bg-white/30 backdrop-blur-md" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}{/* Mobile Menu - Slide from right, full height and width */}
      <div className={`
        lg:hidden fixed top-0 right-0 h-screen w-full bg-white shadow-2xl z-[999]
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header - Fixed size regardless of scroll */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 min-h-[80px]">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="AI Staging App Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-gray-900 font-bold text-xl">AI Staging</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">            {/* Navigation Links */}
            <nav className="space-y-3 mb-8">
              <Link 
                href="/features" 
                className="block py-4 px-4 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/upload" 
                className="block py-4 px-4 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Upload
              </Link>
              <Link 
                href="/pricing" 
                className="block py-4 px-4 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="#faq" 
                className="block py-4 px-4 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </nav>{/* Mobile User Section */}
            {isAuthenticated ? (
              <div className="border-t border-gray-200 pt-6">
                {/* User Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    Hello, {userData?.firstName || user?.displayName?.split(' ')[0] || 'User'}
                  </div>
                  
                  {/* Plan Display */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        userTier === 'free' ? 'bg-gray-400' : 
                        userTier === 'basic' ? 'bg-yellow-400' : 'bg-purple-400'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {isLoading ? '...' : currentPlan.name} Plan
                      </span>
                    </div>
                    {userTier === 'free' && (
                      <button 
                        onClick={() => {
                          handleUpgradeClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-semibold rounded-full text-xs"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Limit */}
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                    </svg>
                    <span className={`font-medium ${isLimitReached ? 'text-red-600' : 'text-gray-600'}`}>
                      {isLoading ? '...' : `${remainingUploads}/${totalUploads}`}
                    </span>                    <span className="text-gray-500">
                      {userTier === 'free' ? 'total' : 'this month'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link 
                    href="/upload"
                    className="block w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full text-center hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Upload Image
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-center"
                  >
                    Logout
                  </button>
                </div>
              </div>            ) : (
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <Link 
                  href="/login"
                  className="block w-full py-4 px-4 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 text-center text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="block w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-center text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
