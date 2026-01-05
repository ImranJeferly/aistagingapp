'use client';

import { useAuth } from '@/contexts/AuthContext';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

const ADMIN_EMAIL = 'imranjeferly@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      }
      setChecking(false);
    }
  }, [user, isLoading]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r-2 border-black h-screen fixed overflow-y-auto">
          <div className="p-6 border-b-2 border-black">
            <h1 className="text-xl font-black font-brand">ADMIN PANEL</h1>
            <p className="text-xs text-gray-500 mt-1">Super User Access</p>
          </div>
          <nav className="p-4 space-y-2">
            <a href="/admin" className="block px-4 py-2 bg-black text-white rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
              Dashboard
            </a>
            <a href="/admin/blogs" className="block px-4 py-2 hover:bg-gray-100 rounded-lg font-bold border-2 border-transparent hover:border-black transition-all">
              Blogs
            </a>
            <a href="/admin/users" className="block px-4 py-2 hover:bg-gray-100 rounded-lg font-bold border-2 border-transparent hover:border-black transition-all">
              Users
            </a>
            <a href="/admin/stats" className="block px-4 py-2 hover:bg-gray-100 rounded-lg font-bold border-2 border-transparent hover:border-black transition-all">
              Statistics
            </a>
            <a href="/admin/settings" className="block px-4 py-2 hover:bg-gray-100 rounded-lg font-bold border-2 border-transparent hover:border-black transition-all">
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
