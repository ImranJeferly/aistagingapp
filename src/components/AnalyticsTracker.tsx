'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Determine the current date in YYYY-MM-DD format (local time is fine for this)
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `analytics_viewed_${pathname}_${today}`;
    
    // Check if this user has already visited this page today
    const hasVisited = localStorage.getItem(storageKey);

    if (!hasVisited) {
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
          // If server failed, remove the flag so we can try again
          localStorage.removeItem(storageKey);
        }
      })
      .catch(err => {
        console.error('Analytics error:', err);
        // If network failed, remove the flag so we can try again
        localStorage.removeItem(storageKey);
      });
    }
  }, [pathname]);

  return null;
}
