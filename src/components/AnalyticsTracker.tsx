'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking for admin pages
    if (pathname?.startsWith('/admin')) {
      return;
    }

    // Determine the current date in YYYY-MM-DD format (local time is fine for this)
    const today = new Date().toISOString().split('T')[0];
    // Changed key version to V2 to flush out any 'stuck' failed visit flags from before the fix
    const storageKey = `analytics_viewed_v2_${pathname}_${today}`;
    
    // Check if this user has already visited this page today
    const hasVisited = localStorage.getItem(storageKey);

    if (!hasVisited) {
      console.log('📊 Tracking page view:', pathname); // Debug log to confirming firing
      
      // Mark as visited BEFORE the request to prevent double-firing
      localStorage.setItem(storageKey, 'true');

      // Send tracking event
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: pathname,
          date: today
        }),
      })
      .then(res => {
        if (!res.ok) {
          // If 500 (Server Config Error), do NOT retry. The server is broken.
          // We leave the storage key 'true' so we don't spam requests.
          if (res.status === 500) {
             console.error('📊 Analytics disabled: Server configuration missing (check FIREBASE_PRIVATE_KEY)');
             return;
          }

          console.warn('📊 Tracking failed, retry scheduled for next visit:', res.status);
          // If other error (network/timeout)rage key 'true' so we don't spam requests.
          if (res.status === 500) {
             console.error('📊 Analytics disabled: Server configuration missing (check FIREBASE_PRIVATE_KEY)');
             return;
          }

          console.warn('📊 Tracking failed, retry scheduled for next visit:', res.status);
          // If other error (network/timeout), remove the flag so we can try again
          localStorage.removeItem(storageKey);
        } else {
             console.log('📊 Tracking success');
        }
      })
      .catch(err => {
        console.error('📊 Analytics error:', err);
        // If network failed, remove the flag so we can try again
        localStorage.removeItem(storageKey);
      });
    } else {
       console.log('📊 Already tracked today:', pathname);
    }
  }, [pathname]);

  return null;
}
