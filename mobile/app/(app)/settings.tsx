import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { ENV } from '../../src/lib/config';
import * as HealthService from '../../src/lib/healthService';

interface SettingsItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);
  const [healthConnected, setHealthConnected] = useState(false);
  const [connectingHealth, setConnectingHealth] = useState(false);

  useEffect(() => {
    checkHealthAvailability();
  }, []);

  const checkHealthAvailability = async () => {
    const available = await HealthService.isHealthAvailable();
    setHealthAvailable(available);
  };

  const handleConnectHealth = async () => {
    setConnectingHealth(true);
    try {
      const success = await HealthService.requestHealthPermissions();
      if (success) {
        setHealthConnected(true);
        Alert.alert(
          'Connected!',
          `Successfully connected to ${HealthService.getHealthAppName()}. Your workouts will now sync automatically.`
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Connection Failed',
        error?.message || `Could not connect to ${HealthService.getHealthAppName()}`
      );
    } finally {
      setConnectingHealth(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    // Open Stripe billing portal in browser
    Linking.openURL(`${ENV.BACKEND_URL}/api/stripe/create-portal-session?user_id=${user?.id}`);
  };

  const handleOpenURL = (url: string) => {
    Linking.openURL(url);
  };

  const SettingsSection = ({ title, items }: { title: string; items: SettingsItem[] }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8, marginLeft: 4 }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: '#1A1A2E',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#374151',
      }}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            onPress={item.onPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: '#374151',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 16 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: item.danger ? '#EF4444' : '#fff', fontSize: 16 }}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {item.rightElement || <Text style={{ color: '#6B7280', fontSize: 20 }}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Build health items based on platform
  const healthItems: SettingsItem[] = [];
  
  if (Platform.OS === 'ios' && healthAvailable) {
    healthItems.push({
      icon: '❤️',
      title: 'Apple Health',
      subtitle: healthConnected ? 'Connected' : 'Sync workouts and activity',
      onPress: handleConnectHealth,
      rightElement: connectingHealth ? (
        <ActivityIndicator color="#7C3AED" size="small" />
      ) : healthConnected ? (
        <Text style={{ color: '#10B981', fontSize: 14 }}>✓</Text>
      ) : (
        <Text style={{ color: '#7C3AED', fontSize: 14 }}>Connect</Text>
      ),
    });
  }
  
  if (Platform.OS === 'android' && healthAvailable) {
    healthItems.push({
      icon: '💚',
      title: 'Health Connect',
      subtitle: healthConnected ? 'Connected' : 'Sync workouts and activity',
      onPress: handleConnectHealth,
      rightElement: connectingHealth ? (
        <ActivityIndicator color="#7C3AED" size="small" />
      ) : healthConnected ? (
        <Text style={{ color: '#10B981', fontSize: 14 }}>✓</Text>
      ) : (
        <Text style={{ color: '#7C3AED', fontSize: 14 }}>Connect</Text>
      ),
    });
  }

  if (healthItems.length === 0) {
    healthItems.push({
      icon: Platform.OS === 'ios' ? '❤️' : '💚',
      title: Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect',
      subtitle: 'Not available on this device',
      onPress: () => {},
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 }}>
          Settings
        </Text>

        {/* Account Info */}
        <View style={{
          backgroundColor: '#1A1A2E',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: '#374151',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#7C3AED',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                {user?.email || 'User'}
              </Text>
              <Text style={{ color: '#9CA3AF', marginTop: 4 }}>Free Plan</Text>
            </View>
          </View>
        </View>

        {/* Subscription */}
        <SettingsSection
          title="SUBSCRIPTION"
          items={[
            {
              icon: '💎',
              title: 'Upgrade to Premium',
              subtitle: 'Unlock all features',
              onPress: () => router.push('/(app)/paywall'),
            },
            {
              icon: '💳',
              title: 'Manage Subscription',
              subtitle: 'Billing and payment',
              onPress: handleManageSubscription,
            },
          ]}
        />

        {/* Profile */}
        <SettingsSection
          title="PROFILE"
          items={[
            {
              icon: '👤',
              title: 'Edit Profile',
              subtitle: 'Name, goals, preferences',
              onPress: () => router.push('/(app)/onboarding'),
            },
            {
              icon: '🔔',
              title: 'Notifications',
              subtitle: 'Reminders and alerts',
              onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available in a future update.'),
            },
          ]}
        />

        {/* Health */}
        <SettingsSection
          title="HEALTH CONNECTIONS"
          items={healthItems}
        />

        {/* Support */}
        <SettingsSection
          title="SUPPORT"
          items={[
            {
              icon: '📧',
              title: 'Contact Support',
              subtitle: 'Get help from our team',
              onPress: () => Linking.openURL('mailto:support@bisagroup.org'),
            },
            {
              icon: '📜',
              title: 'Terms of Service',
              onPress: () => handleOpenURL('https://bisafit.com/terms'),
            },
            {
              icon: '🔒',
              title: 'Privacy Policy',
              onPress: () => handleOpenURL('https://bisafit.com/privacy'),
            },
          ]}
        />

        {/* Account Actions */}
        <SettingsSection
          title="ACCOUNT"
          items={[
            {
              icon: '🚪',
              title: 'Sign Out',
              onPress: handleLogout,
              danger: true,
            },
          ]}
        />

        {/* App Version */}
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>BisaFit v1.0.0</Text>
          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>© 2026 Bisa Group LLC</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
