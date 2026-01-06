"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {  
  registerWithEmailAndPassword,
  loginWithEmailAndPassword,
  loginWithGoogle,
  logout as authLogout,
  getUserData,
  createUserDocument,
  UserData,
  RegisterData
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mark session as active to track internal navigation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_session_active', 'true');
    }
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Unsubscribe from previous snapshot listener if exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // Ensure user document exists and has all required fields
        // This will create the doc if missing, or backfill missing fields (like name/email) if they exist in Auth but not Firestore
        await createUserDocument(user);

        // Track IP address and check for abuse
        try {
          const token = await user.getIdToken();

          // Check for guest uploads to migrate
          if (typeof window !== 'undefined') {
             const guestSessionId = localStorage.getItem('guest_session_id');
             if (guestSessionId) {
                fetch('/api/user/migrate-guest-uploads', {
                   method: 'POST',
                   headers: {
                       'Authorization': `Bearer ${token}`,
                       'Content-Type': 'application/json'
                   },
                   body: JSON.stringify({ sessionId: guestSessionId })
                }).then(async (res) => {
                    const data = await res.json();
                    if (res.ok && data.success) {
                        console.log(`Migrated ${data.count} guest uploads`);
                        localStorage.removeItem('guest_session_id');
                    }
                }).catch(e => console.warn("Failed to migrate guest uploads", e));
             }
          }

          fetch('/api/auth/track-ip', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => {
            if (!res.ok && res.status === 500) {
              console.warn('IP Tracking disabled: Server configuration missing keys');
            }
          }).catch(err => console.error('IP tracking failed:', err));
        } catch (error) {
          console.error('Error getting token for IP tracking:', error);
        }
        
        // Set up real-time listener for user data
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data() as UserData);
          } else {
            setUserData(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setIsLoading(false);
        });
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await loginWithEmailAndPassword(email, password);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      await registerWithEmailAndPassword(userData);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    userData,
    isLoading,
    login,
    loginWithGoogle: handleGoogleLogin,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
