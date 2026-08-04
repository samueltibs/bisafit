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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface ProgressEntry {
  id: string;
  entry_date: string;
  weight_kg: number | null;
  waist_cm: number | null;
  notes: string | null;
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEntry, setNewEntry] = useState({ weight: '', waist: '', notes: '' });

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(30);

      setEntries(data || []);
    } catch (error) {
      console.log('Error fetching progress:', error);
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

  const handleAddEntry = async () => {
    if (!user) return;

    const weight = parseFloat(newEntry.weight) || null;
    const waist = parseFloat(newEntry.waist) || null;

    if (!weight && !waist) {
      Alert.alert('Error', 'Please enter at least weight or waist measurement');
      return;
    }

    try {
      const { error } = await supabase.from('progress_entries').insert({
        user_id: user.id,
        entry_date: new Date().toISOString().split('T')[0],
        weight_kg: weight,
        waist_cm: waist,
        notes: newEntry.notes || null,
      });

      if (error) throw error;

      setModalVisible(false);
      setNewEntry({ weight: '', waist: '', notes: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const getStats = () => {
    if (entries.length === 0) return null;

    const latestWeight = entries.find(e => e.weight_kg)?.weight_kg;
    const firstWeight = [...entries].reverse().find(e => e.weight_kg)?.weight_kg;
    const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

    return {
      currentWeight: latestWeight,
      weightChange,
      totalEntries: entries.length,
    };
  };

  const stats = getStats();

  // Simple chart visualization
  const SimpleChart = () => {
    const weightEntries = entries.filter(e => e.weight_kg).slice(0, 7).reverse();
    if (weightEntries.length < 2) return null;

    const weights = weightEntries.map(e => e.weight_kg!);
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    const range = max - min || 1;

    const screenWidth = Dimensions.get('window').width - 80;
    const chartHeight = 120;

    return (
      <View style={{ marginTop: 16 }}>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>WEIGHT TREND (LAST 7)</Text>
        <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          {weightEntries.map((entry, index) => {
            const height = ((entry.weight_kg! - min) / range) * (chartHeight - 20) + 20;
            return (
              <View key={entry.id} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10, marginBottom: 4 }}>
                  {entry.weight_kg}
                </Text>
                <View
                  style={{
                    width: '100%',
                    height,
                    backgroundColor: '#7C3AED',
                    borderRadius: 4,
                  }}
                />
                <Text style={{ color: '#6B7280', fontSize: 8, marginTop: 4 }}>
                  {new Date(entry.entry_date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
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
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>Progress</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#7C3AED',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#1A1A2E',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#374151',
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>CURRENT</Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>
                {stats.currentWeight || '-'}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>kg</Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: '#1A1A2E',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#374151',
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>CHANGE</Text>
              <Text style={{ 
                color: stats.weightChange === null ? '#fff' : stats.weightChange > 0 ? '#EF4444' : '#10B981', 
                fontSize: 28, 
                fontWeight: 'bold', 
                marginTop: 4 
              }}>
                {stats.weightChange !== null ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)}` : '-'}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>kg</Text>
            </View>
          </View>
        )}

        {/* Weight Chart */}
        {entries.length > 1 && (
          <View style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <SimpleChart />
          </View>
        )}

        {/* Recent Entries */}
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
          Recent Entries
        </Text>
        {entries.length === 0 ? (
          <View style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>
              No progress entries yet.{'\n'}Start tracking your progress!
            </Text>
          </View>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <View key={entry.id} style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#374151',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  {new Date(entry.entry_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 24 }}>
                {entry.weight_kg && (
                  <View>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Weight</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                      {entry.weight_kg} kg
                    </Text>
                  </View>
                )}
                {entry.waist_cm && (
                  <View>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Waist</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                      {entry.waist_cm} cm
                    </Text>
                  </View>
                )}
              </View>
              {entry.notes && (
                <Text style={{ color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' }}>
                  "{entry.notes}"
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#1A1A2E',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Log Progress</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#9CA3AF', fontSize: 24 }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: '#D1D5DB', marginBottom: 8 }}>Weight (kg)</Text>
                <TextInput
                  style={{
                    backgroundColor: '#252540',
                    borderRadius: 8,
                    padding: 16,
                    color: '#fff',
                    fontSize: 16,
                  }}
                  placeholder="e.g. 75.5"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={newEntry.weight}
                  onChangeText={(text) => setNewEntry({ ...newEntry, weight: text })}
                />
              </View>
              <View>
                <Text style={{ color: '#D1D5DB', marginBottom: 8 }}>Waist (cm)</Text>
                <TextInput
                  style={{
                    backgroundColor: '#252540',
                    borderRadius: 8,
                    padding: 16,
                    color: '#fff',
                    fontSize: 16,
                  }}
                  placeholder="e.g. 80"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={newEntry.waist}
                  onChangeText={(text) => setNewEntry({ ...newEntry, waist: text })}
                />
              </View>
              <View>
                <Text style={{ color: '#D1D5DB', marginBottom: 8 }}>Notes (optional)</Text>
                <TextInput
                  style={{
                    backgroundColor: '#252540',
                    borderRadius: 8,
                    padding: 16,
                    color: '#fff',
                    fontSize: 16,
                    minHeight: 80,
                  }}
                  placeholder="How are you feeling?"
                  placeholderTextColor="#6B7280"
                  multiline
                  value={newEntry.notes}
                  onChangeText={(text) => setNewEntry({ ...newEntry, notes: text })}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddEntry}
              style={{
                backgroundColor: '#7C3AED',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 24,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
