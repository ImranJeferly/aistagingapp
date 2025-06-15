import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRemainingUploads, getUserDailyLimit, getUserMonthlyLimit, getUserTier } from '../services/uploadService';

export const useUploadLimit = () => {
  const { user, isAuthenticated } = useAuth();
  const [remainingUploads, setRemainingUploads] = useState<{ daily: number; monthly: number }>({ daily: 1, monthly: 30 });
  const [totalLimits, setTotalLimits] = useState<{ daily: number; monthly: number }>({ daily: 1, monthly: 30 });
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchUploadLimits = async () => {
    if (!user || !isAuthenticated) {
      setRemainingUploads({ daily: 1, monthly: 30 });
      setTotalLimits({ daily: 1, monthly: 30 });
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
      setUserTier(tier);
    } catch (error) {
      console.error('Error fetching upload limits:', error);
      // Default to free tier for new users or when there's an error
      setRemainingUploads({ daily: 1, monthly: 30 });
      setTotalLimits({ daily: 1, monthly: 30 });
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

  // For free tier, show daily limits. For paid tiers, show monthly limits
  const isLimitReached = userTier === 'free' 
    ? remainingUploads.daily <= 0 
    : remainingUploads.monthly <= 0;

  const displayRemaining = userTier === 'free' 
    ? remainingUploads.daily 
    : remainingUploads.monthly;

  const displayUsed = userTier === 'free'
    ? totalLimits.daily - remainingUploads.daily
    : totalLimits.monthly - remainingUploads.monthly;

  const displayTotal = userTier === 'free'
    ? totalLimits.daily
    : totalLimits.monthly;

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
