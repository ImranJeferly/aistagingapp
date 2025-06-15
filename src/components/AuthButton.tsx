"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Button from './Button';

interface AuthButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hoverColor?: string;
  requireAuth?: boolean;
  redirectTo?: string;
  onClick?: () => void;
}

export default function AuthButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  hoverColor = 'bg-blue-600',
  requireAuth = true,
  redirectTo = '/login',
  onClick
}: AuthButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const handleClick = () => {
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    } else if (isAuthenticated && (redirectTo === '/login' || redirectTo === '/register')) {
      // If user is authenticated and button would go to auth pages, go to upload instead
      router.push('/upload');
    } else if (isAuthenticated && redirectTo) {
      // If user is authenticated and there's a specific redirect, use it
      router.push(redirectTo);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      hoverColor={hoverColor}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
