import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRemainingUploads, DAILY_UPLOAD_LIMIT } from '../services/uploadService';

export const useUploadLimit = () => {
  const { user, isAuthenticated } = useAuth();
  const [remainingUploads, setRemainingUploads] = useState<number>(DAILY_UPLOAD_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const fetchRemainingUploads = async () => {
    if (!user || !isAuthenticated) {
      setRemainingUploads(DAILY_UPLOAD_LIMIT);
      return;
    }

    setIsLoading(true);
    try {
      const remaining = await getRemainingUploads(user.uid);
      setRemainingUploads(remaining);
    } catch (error) {
      console.error('Error fetching remaining uploads:', error);
      // Default to full limit for new users or when there's an error
      setRemainingUploads(DAILY_UPLOAD_LIMIT);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemainingUploads();
  }, [user, isAuthenticated]);

  const refreshLimit = () => {
    fetchRemainingUploads();
  };

  return {
    remainingUploads,
    usedUploads: DAILY_UPLOAD_LIMIT - remainingUploads,
    totalUploads: DAILY_UPLOAD_LIMIT,
    isLimitReached: remainingUploads <= 0,
    isLoading,
    refreshLimit
  };
};
