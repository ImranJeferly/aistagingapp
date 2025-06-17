import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRemainingUploads, getUserDailyLimit, getUserMonthlyLimit, getUserTier } from '../services/uploadService';

export const useUploadLimit = () => {
  const { user, isAuthenticated } = useAuth();
  const [remainingUploads, setRemainingUploads] = useState<{ daily: number; monthly: number }>({ daily: 999, monthly: 5 });
  const [totalLimits, setTotalLimits] = useState<{ daily: number; monthly: number }>({ daily: 999, monthly: 5 });
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchUploadLimits = async () => {
    if (!user || !isAuthenticated) {
      setRemainingUploads({ daily: 999, monthly: 5 });
      setTotalLimits({ daily: 999, monthly: 5 });
      setUserTier('free');
      return;
    }

    setIsLoading(true);
    try {
      const [remaining, dailyLimit, monthlyLimit, tier] = await Promise.all([
        getRemainingUploads(user.uid),
        getUserDailyLimit(user.uid),
        getUserMonthlyLimit(user.uid),
        getUserTier(user.uid)
      ]);
      
      setRemainingUploads(remaining);
      setTotalLimits({ daily: dailyLimit, monthly: monthlyLimit });
      setUserTier(tier);    } catch (error) {
      console.error('Error fetching upload limits:', error);
      // Default to free tier for new users or when there's an error
      setRemainingUploads({ daily: 999, monthly: 5 });
      setTotalLimits({ daily: 999, monthly: 5 });
      setUserTier('free');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadLimits();
  }, [user, isAuthenticated]);

  const refreshLimit = () => {
    fetchUploadLimits();
  };
  // For free tier, show total/lifetime limits (stored in monthly field)
  // For paid tiers, show monthly limits
  const isLimitReached = remainingUploads.monthly <= 0;

  const displayRemaining = remainingUploads.monthly;

  const displayUsed = totalLimits.monthly - remainingUploads.monthly;

  const displayTotal = totalLimits.monthly;

  return {
    remainingUploads: displayRemaining,
    usedUploads: displayUsed,
    totalUploads: displayTotal,
    userTier,
    isLimitReached,
    isLoading,
    refreshLimit,
    // Additional data for more detailed display if needed
    fullLimits: {
      daily: remainingUploads.daily,
      monthly: remainingUploads.monthly,
      totalDaily: totalLimits.daily,
      totalMonthly: totalLimits.monthly
    }
  };
};
