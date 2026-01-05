"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLink from './NavLink';
import UserDropdown from './UserDropdown';
import Button from './Button';
import AuthButton from './AuthButton';
import { useAuth } from '../contexts/AuthContext';
import { useUploadLimit } from '../hooks/useUploadLimit';
import { getCurrentPlan } from '../services/pricingService';

export default function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
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
      setShowPromo(scrollPosition < 10);
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
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Promo Banner */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[60] bg-[#FF90E8] border-b-2 border-black text-black overflow-hidden py-2.5 transition-transform duration-500 ease-in-out ${
          showPromo && pathname !== '/upload' && pathname !== '/profile' && !isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center w-full">
          <div className="whitespace-nowrap animate-marquee flex items-center shrink-0">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="mx-6 font-black text-sm tracking-wide flex items-center gap-2 font-brand">
                <span>ENJOY 15% OFF FOR A LIMITED TIME!</span>
                <span className="bg-black text-white px-2 py-0.5 rounded transform -rotate-2 border border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">CODE: LAUNCH15</span>
              </span>
            ))}
          </div>
          <div className="whitespace-nowrap animate-marquee flex items-center shrink-0">
            {[...Array(8)].map((_, i) => (
              <span key={`clone-${i}`} className="mx-6 font-black text-sm tracking-wide flex items-center gap-2 font-brand">
                <span>ENJOY 15% OFF FOR A LIMITED TIME!</span>
                <span className="bg-black text-white px-2 py-0.5 rounded transform -rotate-2 border border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">CODE: LAUNCH15</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <header className={`fixed left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 ease-in-out ${
        showPromo && pathname !== '/upload' && pathname !== '/profile' && !isMobileMenuOpen ? 'top-11' : 'top-0'
      } ${
        isScrolled 
          ? 'bg-[#FFFCF5]/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4' 
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
              className="h-12 px-6 flex items-center justify-center bg-[#8B5CF6] text-white font-bold rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#A78BFA] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-sm"
            >
              Upload
            </Link>
            
            <UserDropdown 
              user={user}
              userData={userData}
              userTier={userTier}
              remainingUploads={remainingUploads}
              totalUploads={totalUploads}
              isLimitReached={isLimitReached}
              isLoading={isLoading}
              logout={logout}
              handleUpgradeClick={handleUpgradeClick}
            /></>
        ) : (
          <>
            <Link 
              href="/login"
              className="px-6 py-2 bg-white text-black font-bold rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-6 py-2 bg-[#8B5CF6] text-white font-bold rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#A78BFA] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
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
        lg:hidden fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-[#FFFCF5] border-l-2 border-black z-[999]
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header - Fixed size regardless of scroll */}
          <div className="flex items-center justify-between p-6 min-h-[80px] bg-[#FFFCF5]">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="AI Staging App Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-gray-900 font-bold text-xl tracking-wide">AI Staging App</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-900 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">            {/* Navigation Links */}
            <nav className="space-y-4 mb-8">
              {[
                { href: '/features', label: 'Features' },
                { href: '/upload', label: 'Upload' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/#faq', label: 'FAQ' }
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="block py-3 px-4 text-black font-bold text-lg border-2 border-transparent hover:border-black hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>{/* Mobile User Section */}
            {isAuthenticated ? (
              <div className="pt-6">
                {/* User Info */}
                <div className="mb-6 p-4 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    Signed in as {userData?.firstName || user?.displayName?.split(' ')[0] || 'User'}
                  </div>
                  
                  {/* Plan Display */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border border-black ${
                        userTier === 'free' ? 'bg-gray-400' : 
                        userTier === 'basic' ? 'bg-[#FACC15]' : 'bg-[#FF90E8]'
                      }`}></div>
                      <span className="font-black text-black">
                        {isLoading ? '...' : currentPlan.name} Plan
                      </span>
                    </div>
                    {userTier === 'free' && (
                      <button 
                        onClick={() => {
                          handleUpgradeClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="px-3 py-1 bg-[#FACC15] text-black font-bold rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs hover:-translate-y-0.5 transition-transform"
                      >
                        UPGRADE
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Limit */}
                  <div className="flex items-center gap-2 text-sm font-bold border-t-2 border-gray-100 pt-3">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                    </svg>
                    <span className={`font-black ${isLimitReached ? 'text-red-600' : 'text-black'}`}>
                      {isLoading ? '...' : `${remainingUploads}/${totalUploads}`}
                    </span>
                    <span className="text-gray-500">
                      uploads left {userTier === 'free' ? 'total' : 'this month'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link 
                    href="/profile"
                    className="block w-full py-3 px-4 bg-white text-black font-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center hover:bg-gray-50 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/upload"
                    className="block w-full py-3 px-4 bg-[#8B5CF6] text-white font-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center hover:bg-[#A78BFA] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Upload Image
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full py-3 px-4 bg-white text-black font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center hover:bg-gray-50 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>            ) : (
              <div className="pt-6 space-y-4">
                <Link 
                  href="/login"
                  className="block w-full py-3 px-4 bg-white text-black font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center text-lg hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="block w-full py-3 px-4 bg-[#8B5CF6] text-white font-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center text-lg hover:bg-[#A78BFA] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
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
    </>
  );
}
