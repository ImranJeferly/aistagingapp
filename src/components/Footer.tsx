"use client";

import React from 'react';

export default function Footer() {
  return (    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/logo.png" 
              alt="AI Staging App Logo" 
              className="w-8 h-8 object-contain"
            />
            <p className="text-white font-semibold">AI Staging App</p>
          </div>
          <p className="text-gray-400 text-sm">imranjeferly@gmail.com</p>
        </div>
      </div>
    </footer>
  );
}
