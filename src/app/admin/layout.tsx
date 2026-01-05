'use client';

import { useAuth } from '@/contexts/AuthContext';
import { notFound, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, Users, BarChart2, Settings, ArrowLeft } from 'lucide-react';

const ADMIN_EMAIL = 'imranjeferly@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      }
      setChecking(false);
    }
  }, [user, isLoading]);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    // { name: 'Statistics', href: '/admin/stats', icon: BarChart2 },
    // { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

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
        <aside className="w-64 bg-white border-r-2 border-black h-screen fixed overflow-y-auto z-50">
          <div className="p-6 border-b-2 border-black">
            <h1 className="text-xl font-black font-brand">ADMIN PANEL</h1>
            <p className="text-xs text-gray-500 mt-1">Super User Access</p>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = item.href === '/admin' 
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);
              
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold border-2 transition-all ${
                    isActive 
                      ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]' 
                      : 'bg-transparent border-transparent hover:border-black hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 mt-auto border-t-2 border-black">
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Site
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
