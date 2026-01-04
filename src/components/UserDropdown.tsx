"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentPlan, PricingTier } from '../services/pricingService';
import ProfileAvatar from './ProfileAvatar';

interface UserDropdownProps {
  user: any;
  userData: any;
  userTier: PricingTier;
  remainingUploads: number;
  totalUploads: number;
  isLimitReached: boolean;
  isLoading: boolean;
  logout: () => void;
  handleUpgradeClick: () => void;
}

export default function UserDropdown({
  user,
  userData,
  userTier,
  remainingUploads,
  totalUploads,
  isLimitReached,
  isLoading,
  logout,
  handleUpgradeClick
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const currentPlan = getCurrentPlan(userTier);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}`
    : user?.displayName || userData?.firstName || 'User';
  const initial = displayName[0]?.toUpperCase() || 'U';
  
  // Calculate usage for progress bar
  // remainingUploads is what's left. totalUploads is the limit.
  // If remaining is 5 and total is 5, used is 0.
  const usedUploads = totalUploads - remainingUploads;
  const usagePercentage = totalUploads > 0 ? (usedUploads / totalUploads) * 100 : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-1.5 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
      >
        <ProfileAvatar tier={userTier} userId={user?.uid || 'default'} className="w-8 h-8" />
        <span className="font-bold text-sm hidden sm:block truncate max-w-[150px]">{displayName}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-4 border-b-2 border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
          </div>

          <div className="p-4 border-b-2 border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">Current Plan</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border border-black ${
                userTier === 'free' ? 'bg-gray-200' : 
                userTier === 'basic' ? 'bg-yellow-300' : 'bg-[#FF90E8]'
              }`}>
                {currentPlan.name}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Usage</span>
                <span className={isLimitReached ? 'text-red-600' : ''}>
                  {isLoading ? '...' : `${usedUploads} / ${totalUploads}`}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden border-2 border-black">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isLimitReached ? 'bg-red-500' : 'bg-[#8B5CF6]'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 text-right font-medium">
                {userTier === 'free' ? 'Lifetime uploads' : 'Resets monthly'}
              </p>
            </div>

            {userTier === 'free' && (
              <button
                onClick={() => {
                  router.push('/pricing');
                  setIsOpen(false);
                }}
                className="mt-4 w-full py-2 bg-[#FF90E8] text-black font-bold text-sm rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                router.push('/profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </button>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
