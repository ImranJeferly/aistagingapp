"use client";

import { useState, useEffect } from 'react';
import NavLink from './NavLink';
import Button from './Button';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

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
    <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-8 transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'bg-white/70 backdrop-blur-md border-b border-gray-200' 
        : 'bg-transparent border-b border-transparent'
    }`}>      {/* Logo */}
      <div className="flex items-center gap-3 mr-8">
        <img 
          src="/logo.png" 
          alt="AI Staging App Logo" 
          className="w-12 h-12 object-contain"
        />
        <span className="text-gray-900 font-bold text-xl tracking-wide">
          AI Staging App
        </span>
      </div>
        {/* Navigation Links */}
      <nav className="hidden md:flex items-center space-x-12">
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#gallery">Gallery</NavLink>
        <NavLink href="#pricing">Pricing</NavLink>
        <NavLink href="#contact">Contact</NavLink>
      </nav>
      {/* Mobile Menu Button */}
      <button className="md:hidden text-gray-900 p-3 ml-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>      {/* Donate Button */}
      <div className="hidden md:block ml-8">
        <Button size="sm" hoverColor="bg-green-400">
          Get Started
        </Button>
      </div>
    </header>
  );
}
