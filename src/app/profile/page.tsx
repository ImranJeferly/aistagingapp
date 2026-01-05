"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import AuthGuard from '../../components/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useUploadLimit } from '../../hooks/useUploadLimit';
import ProfileAvatar from '../../components/ProfileAvatar';
import { getCurrentPlan } from '../../services/pricingService';
import { updateUserData } from '../../services/authService';

const DECORATION_IMAGES = [
  '/cactus.png', '/chair.png', '/lamp.png', 
  '/plant.png', '/sofa.png', '/stool.png', 
  '/tallplant.png', '/rug.png'
];

const PLAN_COLORS = [
  '#A3E635', // Lime
  '#FF90E8', // Pink
  '#FFC900', // Yellow
  '#00D2FF', // Cyan
  '#FF4D4D', // Red
  '#9B51E0', // Purple
  '#2D9CDB', // Blue
  '#F2994A', // Orange
  '#27AE60', // Green
  '#EB5757', // Salmon
  '#6FCF97', // Mint
  '#BB6BD9', // Lavender
  '#56CCF2', // Sky
  '#F2C94C', // Gold
  '#82C91E', // Grass
  '#FD7E14', // Pumpkin
  '#E64980', // Rose
  '#BE4BDB', // Grape
  '#7950F2', // Violet
  '#15AABF', // Teal
];

type Tab = 'profile' | 'subscription';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, logout } = useAuth();
  const { userTier, remainingUploads, totalUploads } = useUploadLimit();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [planColor, setPlanColor] = useState(PLAN_COLORS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [decorations, setDecorations] = useState<{src: string, top: string, left: string, rotation: number, scale: number}[]>([]);
  const currentPlan = getCurrentPlan(userTier);

  useEffect(() => {
    setPlanColor(PLAN_COLORS[Math.floor(Math.random() * PLAN_COLORS.length)]);
    
    // Pick 6 random images
    const shuffled = [...DECORATION_IMAGES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 6);
    
    // Use pixel values for top position based on initial viewport height
    // This prevents images from jumping when content height changes
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    const items = [
      {
        src: selected[0],
        top: `${vh * 0.1}px`,
        left: '92%',
        rotation: 5 + Math.random() * 5,
        scale: 0.85
      },
      {
        src: selected[1],
        top: `${vh * 0.25}px`,
        left: '2%',
        rotation: -5 - Math.random() * 5,
        scale: 0.8
      },
      {
        src: selected[2],
        top: `${vh * 0.5}px`,
        left: '95%',
        rotation: 8 + Math.random() * 5,
        scale: 0.85
      },
      {
        src: selected[3],
        top: `${vh * 0.6}px`,
        left: '1%',
        rotation: -8 - Math.random() * 5,
        scale: 0.9
      },
      {
        src: selected[4],
        top: `${vh * 0.85}px`,
        left: '94%',
        rotation: 6 + Math.random() * 5,
        scale: 0.8
      },
      {
        src: selected[5],
        top: `${vh * 0.9}px`,
        left: '3%',
        rotation: -6 - Math.random() * 5,
        scale: 0.85
      }
    ];
    setDecorations(items);
  }, []);

  useEffect(() => {
    if (userData || user) {
      const firstName = userData?.firstName || (user?.displayName?.split(' ')[0]) || '';
      const lastName = userData?.lastName || (user?.displayName?.split(' ').slice(1).join(' ')) || '';
      
      setEditForm({
        firstName,
        lastName
      });
    }
  }, [userData, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserData(user.uid, {
        firstName: editForm.firstName,
        lastName: editForm.lastName
      });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          returnToken: true // Request token directly instead of email
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to initiate reset');
      
      if (data.token) {
        // Redirect to reset page with token and source=profile
        router.push(`/reset-password?token=${data.token}&source=profile`);
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Error initiating reset:', error);
      setResetStatus('error');
      setTimeout(() => setResetStatus('idle'), 5000);
    }
  };

  const isGoogleUser = user?.providerData.some(provider => provider.providerId === 'google.com');

  const displayName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}`
    : user?.displayName || 'User';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'subscription', label: 'Subscription' },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFCF5] flex flex-col relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* {decorations.map((item, i) => (
            <motion.img
              key={i}
              src={item.src}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: item.scale }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 + i * 0.1 
              }}
              className="absolute w-48 h-48 object-contain drop-shadow-xl"
              style={{
                top: item.top,
                left: item.left,
                rotate: item.rotation
              }}
            />
          ))} */}
        </div>

        <Navigation />
        
        <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-grow w-full relative z-10">
          {/* Header Section - Cleaner, less boxy */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
            <div className="relative group">
              <ProfileAvatar tier={userTier} userId={user?.uid || 'default'} className="w-32 h-32 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            </div>
            
            <div className="text-center md:text-left flex-1 pb-2">
              <h1 className="text-4xl font-black text-gray-900 mb-2">{displayName}</h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-gray-600 font-medium">
                <span>{user?.email}</span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <span className="bg-[#A3E635] text-black border-2 border-black px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider text-xs font-black">
                  {currentPlan.name} Plan
                </span>
              </div>
            </div>

            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Navigation Tabs - Horizontal & Minimal */}
          <div className="flex border-b-2 border-gray-200 mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 font-bold text-lg transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-black' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-1 bg-black"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { 
                      opacity: 1, 
                      x: 0,
                      transition: { 
                        duration: 0.3,
                        staggerChildren: 0.1 
                      }
                    },
                    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
                  }}
                  className={`grid grid-cols-1 ${!isGoogleUser ? 'md:grid-cols-2' : ''} gap-12`}
                >
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black text-gray-900">Personal Info</h2>
                      {!isEditing ? (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-sm cursor-pointer"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-100 border-2 border-black text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveProfile}
                            className="px-4 py-2 bg-[#A3E635] border-2 border-black text-black font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-sm cursor-pointer"
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full text-lg font-bold text-gray-900 border-b-2 border-gray-300 py-2 focus:border-black focus:outline-none bg-transparent transition-colors"
                          />
                        ) : (
                          <div className="text-lg font-bold text-gray-900 border-b-2 border-gray-100 py-2 group-hover:border-gray-300 transition-colors">
                            {userData?.firstName || (user?.displayName?.split(' ')[0]) || 'Not set'}
                          </div>
                        )}
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full text-lg font-bold text-gray-900 border-b-2 border-gray-300 py-2 focus:border-black focus:outline-none bg-transparent transition-colors"
                          />
                        ) : (
                          <div className="text-lg font-bold text-gray-900 border-b-2 border-gray-100 py-2 group-hover:border-gray-300 transition-colors">
                            {userData?.lastName || (user?.displayName?.split(' ').slice(1).join(' ')) || 'Not set'}
                          </div>
                        )}
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                        <div className="text-lg font-bold text-gray-900 border-b-2 border-gray-100 py-2 group-hover:border-gray-300 transition-colors flex justify-between items-center">
                          {user?.email}
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {!isGoogleUser && (
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1 }
                      }}
                      className="space-y-6"
                    >
                      <h2 className="text-2xl font-black text-gray-900">Security</h2>
                      <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">Password</h3>
                            <p className="text-sm text-gray-500">
                              {resetStatus === 'success' 
                                ? 'Reset link sent to your email!' 
                                : resetStatus === 'error'
                                ? 'Error sending link. Try again.'
                                : 'Receive a link to change your password'}
                            </p>
                          </div>
                          <button 
                            onClick={handlePasswordReset}
                            disabled={resetStatus === 'loading' || resetStatus === 'success'}
                            className={`px-4 py-2 font-bold rounded-lg transition-colors text-sm ${
                              resetStatus === 'success' 
                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                : resetStatus === 'loading'
                                ? 'bg-gray-100 text-gray-400 cursor-wait'
                                : 'bg-gray-100 hover:bg-gray-200 text-black'
                            }`}
                          >
                            {resetStatus === 'loading' ? 'Sending...' : resetStatus === 'success' ? 'Sent!' : 'Update'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <motion.div
                  key="subscription"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        type: "spring",
                        bounce: 0.4,
                        duration: 0.8
                      }
                    },
                    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
                  }}
                  className="w-full"
                >
                  <div 
                    className="border-2 border-black rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 transition-colors duration-500"
                    style={{ backgroundColor: planColor }}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="font-bold text-black/60 uppercase tracking-wider mb-2">Current Plan</p>
                        <h2 className="text-4xl font-black text-black mb-2">{currentPlan.name}</h2>
                        <p className="font-bold text-black/80">
                          {userTier === 'free' ? 'Basic features active' : 'Pro features active'}
                        </p>
                      </div>
                      {userTier === 'free' && (
                        <Link 
                          href="/pricing"
                          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform inline-block"
                        >
                          Upgrade Plan
                        </Link>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span>Monthly Usage</span>
                        <span>{totalUploads - remainingUploads} / {totalUploads} uploads</span>
                      </div>
                      <div className="h-3 bg-black/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((totalUploads - remainingUploads) / totalUploads) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: "circOut" }}
                          className="h-full bg-black"
                        />
                      </div>
                      <p className="text-xs font-bold text-black/50 text-right">
                        Resets in {30 - new Date().getDate()} days
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Payment Methods Section */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-gray-900">Payment Methods</h3>
                        <button className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:scale-105 transition-transform text-sm">
                          Change
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border-2 border-black rounded-lg bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-white border-2 border-gray-200 rounded flex items-center justify-center">
                              <span className="font-bold text-xs text-blue-600 italic">VISA</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">Visa ending in 4242</p>
                              <p className="text-sm text-gray-500">Expires 12/2028 • Default</p>
                            </div>
                          </div>

                        </div>
                      </div>
                    </motion.div>

                    {/* Billing History Section */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <h3 className="text-2xl font-black text-gray-900 mb-6">Billing History</h3>
                      
                      <div className="overflow-hidden rounded-xl border-2 border-black">
                        <table className="w-full text-left">
                          <thead className="bg-black text-white border-b-2 border-black">
                            <tr>
                              <th className="p-4 font-black text-sm uppercase tracking-wider">Invoice</th>
                              <th className="p-4 font-black text-sm uppercase tracking-wider">Date</th>
                              <th className="p-4 font-black text-sm uppercase tracking-wider">Amount</th>
                              <th className="p-4 font-black text-sm uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-black bg-white">
                            {[
                              { id: 'INV-2024-001', date: 'Dec 01, 2024', amount: '$29.00', status: 'Paid' },
                              { id: 'INV-2023-012', date: 'Nov 01, 2024', amount: '$29.00', status: 'Paid' },
                              { id: 'INV-2023-011', date: 'Oct 01, 2024', amount: '$29.00', status: 'Paid' },
                            ].map((invoice) => (
                              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-bold text-black">{invoice.id}</td>
                                <td className="p-4 font-medium text-gray-600">{invoice.date}</td>
                                <td className="p-4 font-black text-black">{invoice.amount}</td>
                                <td className="p-4">
                                  <span className="px-3 py-1 bg-[#A3E635] text-black text-xs font-black rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {invoice.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        
        <Footer />
      </div>
    </AuthGuard>
  );
}
