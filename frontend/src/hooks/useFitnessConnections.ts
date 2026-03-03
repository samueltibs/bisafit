/**
 * Fitness Connections Hook
 * Manages connected fitness platforms (Fitbit, Strava, Apple Health, Google Fit)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { FitbitOAuthService } from '@/lib/fitbitOAuthService';
import { StravaOAuthService } from '@/lib/stravaOAuthService';
import { isIOSPlatform, isAndroidPlatform } from '@/lib/healthPlatforms';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

export interface FitnessConnection {
  platform: string;
  connected: boolean;
  name: string;
  icon: string;
  color: string;
  description: string;
  available: boolean;
}

export interface FitnessConnectionsState {
  fitbit: boolean;
  strava: boolean;
  appleHealth: boolean;
  googleFit: boolean;
}

export function useFitnessConnections() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<FitnessConnectionsState>({
    fitbit: false,
    strava: false,
    appleHealth: false,
    googleFit: false,
  });
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch OAuth connections from backend
      const response = await fetch(`${BACKEND_URL}/api/fitness/connections/${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setConnections(prev => ({
          ...prev,
          fitbit: data.fitbit?.connected || false,
          strava: data.strava?.connected || false,
        }));
      }
    } catch (error) {
      console.error('Error fetching fitness connections:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  /**
   * Connect to Fitbit
   */
  const connectFitbit = async (): Promise<void> => {
    if (!user) return;
    
    setConnecting('fitbit');
    try {
      await FitbitOAuthService.startOAuthFlow(user.id);
    } catch (error) {
      console.error('Error starting Fitbit OAuth:', error);
      setConnecting(null);
      throw error;
    }
  };

  /**
   * Disconnect Fitbit
   */
  const disconnectFitbit = async (): Promise<void> => {
    if (!user) return;
    
    try {
      await FitbitOAuthService.disconnect(user.id);
      setConnections(prev => ({ ...prev, fitbit: false }));
    } catch (error) {
      console.error('Error disconnecting Fitbit:', error);
      throw error;
    }
  };

  /**
   * Connect to Strava
   */
  const connectStrava = async (): Promise<void> => {
    if (!user) return;
    
    setConnecting('strava');
    try {
      await StravaOAuthService.startOAuthFlow(user.id);
    } catch (error) {
      console.error('Error starting Strava OAuth:', error);
      setConnecting(null);
      throw error;
    }
  };

  /**
   * Disconnect Strava
   */
  const disconnectStrava = async (): Promise<void> => {
    if (!user) return;
    
    try {
      await StravaOAuthService.disconnect(user.id);
      setConnections(prev => ({ ...prev, strava: false }));
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      throw error;
    }
  };

  /**
   * Get list of available fitness connections
   */
  const getAvailableConnections = (): FitnessConnection[] => {
    const platforms: FitnessConnection[] = [
      {
        platform: 'fitbit',
        connected: connections.fitbit,
        name: 'Fitbit',
        icon: '⌚',
        color: '#00B0B9',
        description: 'Sync workouts, steps, and heart rate from your Fitbit device',
        available: true,
      },
      {
        platform: 'strava',
        connected: connections.strava,
        name: 'Strava',
        icon: '🏃',
        color: '#FC4C02',
        description: 'Import runs, rides, and other activities from Strava',
        available: true,
      },
      {
        platform: 'appleHealth',
        connected: connections.appleHealth,
        name: 'Apple Health',
        icon: '❤️',
        color: '#FF2D55',
        description: 'Sync with Apple Health on your iPhone',
        available: isIOSPlatform(),
      },
      {
        platform: 'googleFit',
        connected: connections.googleFit,
        name: 'Google Fit',
        icon: '💚',
        color: '#4285F4',
        description: 'Connect with Google Fit on your Android device',
        available: isAndroidPlatform(),
      },
    ];

    return platforms;
  };

  return {
    connections,
    loading,
    connecting,
    connectFitbit,
    disconnectFitbit,
    connectStrava,
    disconnectStrava,
    getAvailableConnections,
    refetch: fetchConnections,
  };
}

export default useFitnessConnections;
