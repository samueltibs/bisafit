import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/database';
import type { UserProfile, UserProfileUpdate } from '@/types/database';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const profileData = await getOrCreateUserProfile(user.id);
        setProfile(profileData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load profile');
        console.error('useUserProfile error:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const update = async (updates: UserProfileUpdate): Promise<boolean> => {
    if (!user) return false;

    const updatedProfile = await updateUserProfile(user.id, updates);
    if (updatedProfile) {
      setProfile(updatedProfile);
      return true;
    }
    return false;
  };

  const hasCompletedOnboarding = (): boolean => {
    if (!profile) return false;
    // Consider onboarding complete if user has set their goal and experience level
    return !!(profile.goal_primary && profile.experience_level);
  };

  return {
    profile,
    loading,
    error,
    update,
    hasCompletedOnboarding,
    refetch: async () => {
      if (!user) return;
      setLoading(true);
      const profileData = await getOrCreateUserProfile(user.id);
      setProfile(profileData);
      setLoading(false);
    },
  };
}
