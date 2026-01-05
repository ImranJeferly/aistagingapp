"use client";

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#FFFCF5] text-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/logo.png" 
                alt="AI Staging App Logo" 
                className="w-10 h-10 object-contain"
              />
              <h3 className="text-gray-900 font-black font-brand text-2xl tracking-tight">AI Staging App</h3>
            </div>
            <p className="text-gray-600 mb-6 max-w-md font-medium leading-relaxed">
              Transform empty rooms into stunning spaces with professional AI staging. 
              Perfect for real estate agents and property managers.
            </p>
            <div className="inline-block bg-[#A3E635] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-bold text-sm">Contact: support@aistagingapp.com</p>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-gray-900 font-black font-brand text-lg mb-6 uppercase tracking-wide">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-gray-600 hover:text-[#8B5CF6] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/upload" className="text-gray-600 hover:text-[#8B5CF6] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  Upload
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-[#8B5CF6] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-gray-600 hover:text-[#8B5CF6] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-gray-900 font-black font-brand text-lg mb-6 uppercase tracking-wide">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-[#FF90E8] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-[#FF90E8] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-[#FF90E8] hover:underline decoration-2 underline-offset-2 transition-all font-bold">
                  Upgrade Plan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t-2 border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-bold">
            © 2025 AI Staging App. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-gray-500 hover:text-black text-sm font-bold hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-black text-sm font-bold hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
