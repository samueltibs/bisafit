import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { ENV } from '../../src/lib/config';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    features: ['AI-generated workout plans', 'Nutrition tracking', 'Progress analytics'],
    priceId: 'price_monthly',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$79.99',
    period: '/year',
    features: ['Everything in Monthly', 'Save 33%', 'Priority support'],
    priceId: 'price_annual',
    popular: true,
  },
];

export default function PaywallScreen() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (!plan) return;

      // Create Stripe checkout session and open in browser
      const response = await fetch(`${ENV.BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          price_lookup_key: plan.priceId,
          success_url: 'bisafit://subscription-success',
          cancel_url: 'bisafit://subscription-cancel',
        }),
      });

      const data = await response.json();
      
      if (data.checkout_url) {
        await Linking.openURL(data.checkout_url);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#9CA3AF', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>💎</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' }}>
            Unlock Premium
          </Text>
          <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, fontSize: 16 }}>
            Get personalized AI workouts and track your progress
          </Text>
        </View>

        {/* Plan Cards */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 20,
                padding: 24,
                borderWidth: 3,
                borderColor: selectedPlan === plan.id ? '#7C3AED' : '#374151',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <View style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  backgroundColor: '#7C3AED',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>BEST VALUE</Text>
                </View>
              )}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>{plan.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 36, fontWeight: 'bold' }}>{plan.price}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 16 }}>{plan.period}</Text>
                  </View>
                </View>
                
                {/* Radio */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedPlan === plan.id ? '#7C3AED' : '#6B7280',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {selectedPlan === plan.id && (
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#7C3AED',
                    }} />
                  )}
                </View>
              </View>

              <View style={{ marginTop: 16, gap: 8 }}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#10B981', marginRight: 8 }}>✓</Text>
                    <Text style={{ color: '#D1D5DB' }}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features List */}
        <View style={{
          backgroundColor: '#1A1A2E',
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
        }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            What's included:
          </Text>
          {[
            'AI-powered workout generation',
            'Personalized nutrition plans',
            'Progress tracking & charts',
            'Exercise library with videos',
            'Apple Health integration',
            'Unlimited plan regeneration',
          ].map((feature, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#7C3AED', fontSize: 20, marginRight: 12 }}>✓</Text>
              <Text style={{ color: '#D1D5DB', fontSize: 16 }}>{feature}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Subscribe Button */}
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#374151' }}>
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={loading}
          style={{
            backgroundColor: '#7C3AED',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>
        <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
          Cancel anytime. Secure payment via Stripe.
        </Text>
      </View>
    </SafeAreaView>
  );
}
