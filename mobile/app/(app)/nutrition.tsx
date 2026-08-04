import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealLog {
  id: string;
  meal_type: string;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  logged_at: string;
  items_json: any;
}

export default function NutritionScreen() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<NutritionTargets>({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMeal, setNewMeal] = useState({ type: 'lunch', calories: '', protein: '', carbs: '', fat: '' });

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch nutrition profile for targets
      const { data: profileData } = await supabase
        .from('nutrition_profiles')
        .select('calories_target, protein_g, carbs_g, fat_g')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setTargets({
          calories: profileData.calories_target || 2000,
          protein: profileData.protein_g || 150,
          carbs: profileData.carbs_g || 200,
          fat: profileData.fat_g || 65,
        });
      }

      // Fetch today's meals
      const today = new Date().toISOString().split('T')[0];
      const { data: mealsData } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .order('logged_at', { ascending: true });

      setTodayMeals(mealsData || []);
    } catch (error) {
      console.log('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getTotals = () => {
    return todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleAddMeal = async () => {
    if (!user) return;

    const calories = parseInt(newMeal.calories) || 0;
    const protein = parseInt(newMeal.protein) || 0;
    const carbs = parseInt(newMeal.carbs) || 0;
    const fat = parseInt(newMeal.fat) || 0;

    if (calories === 0) {
      Alert.alert('Error', 'Please enter calories');
      return;
    }

    try {
      const { error } = await supabase.from('meal_logs').insert({
        user_id: user.id,
        meal_type: newMeal.type,
        total_calories: calories,
        total_protein_g: protein,
        total_carbs_g: carbs,
        total_fat_g: fat,
        logged_at: new Date().toISOString(),
        items_json: [],
      });

      if (error) throw error;

      setModalVisible(false);
      setNewMeal({ type: 'lunch', calories: '', protein: '', carbs: '', fat: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to log meal');
    }
  };

  const totals = getTotals();

  const ProgressBar = ({ current, target, color }: { current: number; target: number; color: string }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <View style={{ height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>Nutrition</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#7C3AED',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>+ Log Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Calories Card */}
        <View style={{
          backgroundColor: '#1A1A2E',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#374151',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>CALORIES TODAY</Text>
          <Text style={{ color: '#fff', fontSize: 48, fontWeight: 'bold', marginVertical: 8 }}>
            {totals.calories}
          </Text>
          <Text style={{ color: '#9CA3AF' }}>of {targets.calories} kcal</Text>
          <View style={{ width: '100%', marginTop: 16 }}>
            <ProgressBar current={totals.calories} target={targets.calories} color="#7C3AED" />
          </View>
        </View>

        {/* Macros Grid */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>PROTEIN</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 4 }}>
              {totals.protein}g
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>of {targets.protein}g</Text>
            <View style={{ marginTop: 8 }}>
              <ProgressBar current={totals.protein} target={targets.protein} color="#EF4444" />
            </View>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>CARBS</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 4 }}>
              {totals.carbs}g
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>of {targets.carbs}g</Text>
            <View style={{ marginTop: 8 }}>
              <ProgressBar current={totals.carbs} target={targets.carbs} color="#F59E0B" />
            </View>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>FAT</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 4 }}>
              {totals.fat}g
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>of {targets.fat}g</Text>
            <View style={{ marginTop: 8 }}>
              <ProgressBar current={totals.fat} target={targets.fat} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Today's Meals */}
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
          Today's Meals
        </Text>
        {todayMeals.length === 0 ? (
          <View style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>
              No meals logged yet today.{'\n'}Tap "Log Meal" to get started.
            </Text>
          </View>
        ) : (
          todayMeals.map((meal) => (
            <View key={meal.id} style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#374151',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textTransform: 'capitalize' }}>
                  {meal.meal_type}
                </Text>
                <Text style={{ color: '#7C3AED', fontWeight: '600' }}>{meal.total_calories} kcal</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>P: {meal.total_protein_g}g</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>C: {meal.total_carbs_g}g</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>F: {meal.total_fat_g}g</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#1A1A2E',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Log Meal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#9CA3AF', fontSize: 24 }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Meal Type */}
            <Text style={{ color: '#D1D5DB', marginBottom: 8 }}>Meal Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewMeal({ ...newMeal, type })}
                  style={{
                    flex: 1,
                    backgroundColor: newMeal.type === type ? '#7C3AED' : '#252540',
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', textTransform: 'capitalize', fontSize: 12 }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inputs */}
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ color: '#D1D5DB', marginBottom: 4 }}>Calories *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#252540',
                    borderRadius: 8,
                    padding: 12,
                    color: '#fff',
                    fontSize: 16,
                  }}
                  placeholder="e.g. 500"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={newMeal.calories}
                  onChangeText={(text) => setNewMeal({ ...newMeal, calories: text })}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#D1D5DB', marginBottom: 4 }}>Protein (g)</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#252540',
                      borderRadius: 8,
                      padding: 12,
                      color: '#fff',
                    }}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={newMeal.protein}
                    onChangeText={(text) => setNewMeal({ ...newMeal, protein: text })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#D1D5DB', marginBottom: 4 }}>Carbs (g)</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#252540',
                      borderRadius: 8,
                      padding: 12,
                      color: '#fff',
                    }}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={newMeal.carbs}
                    onChangeText={(text) => setNewMeal({ ...newMeal, carbs: text })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#D1D5DB', marginBottom: 4 }}>Fat (g)</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#252540',
                      borderRadius: 8,
                      padding: 12,
                      color: '#fff',
                    }}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={newMeal.fat}
                    onChangeText={(text) => setNewMeal({ ...newMeal, fat: text })}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddMeal}
              style={{
                backgroundColor: '#7C3AED',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 24,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Log Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
