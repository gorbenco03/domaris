/**
 * IMOBI - Viewings List Screen
 * Shows all viewings with tabs: Upcoming, Past, Cancelled
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { ViewingCard } from '../components';
import { Viewing, ViewingStatus } from '../types';
import { Calendar, Clock, XCircle, ChevronRight, Plus } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Viewings'>;

type TabType = 'upcoming' | 'past' | 'cancelled';

// Mock data for demonstration
const MOCK_VIEWINGS: Viewing[] = [
  {
    id: '1',
    propertyId: 'p1',
    ownerId: 'o1',
    seekerId: 's1',
    property: {
      id: 'p1',
      title: 'Apartament 3 camere modern',
      address: 'Str. Drumul Taberei 45, București',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      price: 120000,
    },
    owner: {
      id: 'o1',
      name: 'Ion Popescu',
      phone: '+40722123456',
    },
    seeker: {
      id: 's1',
      name: 'Maria Ionescu',
      phone: '+40733654321',
    },
    requestedSlots: [
      { date: '2026-01-21', startTime: '10:00', endTime: '10:30' },
      { date: '2026-01-21', startTime: '15:00', endTime: '15:30' },
    ],
    confirmedSlot: { date: '2026-01-21', startTime: '10:00', endTime: '10:30' },
    duration: 30,
    status: 'confirmed',
    createdAt: new Date(),
    confirmedAt: new Date(),
  },
  {
    id: '2',
    propertyId: 'p2',
    ownerId: 'o2',
    seekerId: 's1',
    property: {
      id: 'p2',
      title: 'Casă 4 camere cu grădină',
      address: 'Str. Pipera 120, Voluntari',
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      price: 250000,
    },
    owner: {
      id: 'o2',
      name: 'Ana Marinescu',
    },
    seeker: {
      id: 's1',
      name: 'Maria Ionescu',
    },
    requestedSlots: [
      { date: '2026-01-24', startTime: '14:00', endTime: '14:30' },
    ],
    duration: 30,
    status: 'pending',
    notes: 'Sunt interesat de această proprietate.',
    createdAt: new Date(),
  },
  {
    id: '3',
    propertyId: 'p3',
    ownerId: 'o3',
    seekerId: 's1',
    property: {
      id: 'p3',
      title: 'Studio central',
      address: 'Bulevardul Unirii 10, București',
      price: 75000,
    },
    owner: {
      id: 'o3',
      name: 'George Dumitrescu',
    },
    seeker: {
      id: 's1',
      name: 'Maria Ionescu',
    },
    requestedSlots: [
      { date: '2026-01-15', startTime: '11:00', endTime: '11:30' },
    ],
    confirmedSlot: { date: '2026-01-15', startTime: '11:00', endTime: '11:30' },
    duration: 30,
    status: 'completed',
    createdAt: new Date('2026-01-10'),
    confirmedAt: new Date('2026-01-11'),
    completedAt: new Date('2026-01-15'),
    seekerFeedback: {
      rating: 4,
      interested: true,
      comment: 'Proprietate frumoasă, dar prețul pare ridicat.',
      createdAt: new Date('2026-01-15'),
    },
  },
  {
    id: '4',
    propertyId: 'p4',
    ownerId: 'o4',
    seekerId: 's1',
    property: {
      id: 'p4',
      title: 'Apartament 2 camere renovat',
      address: 'Str. Victoriei 55, București',
      price: 95000,
    },
    owner: {
      id: 'o4',
      name: 'Elena Vasilescu',
    },
    seeker: {
      id: 's1',
      name: 'Maria Ionescu',
    },
    requestedSlots: [
      { date: '2026-01-18', startTime: '16:00', endTime: '16:30' },
    ],
    duration: 30,
    status: 'cancelled',
    createdAt: new Date('2026-01-12'),
    cancelledAt: new Date('2026-01-17'),
  },
];

const ViewingsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [viewings] = useState<Viewing[]>(MOCK_VIEWINGS);
  
  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'upcoming', label: 'Viitoare', icon: <Calendar size={16} /> },
    { key: 'past', label: 'Trecute', icon: <Clock size={16} /> },
    { key: 'cancelled', label: 'Anulate', icon: <XCircle size={16} /> },
  ];
  
  const filteredViewings = viewings.filter(viewing => {
    switch (activeTab) {
      case 'upcoming':
        return ['pending', 'confirmed', 'rescheduled'].includes(viewing.status);
      case 'past':
        return ['completed', 'no_show'].includes(viewing.status);
      case 'cancelled':
        return viewing.status === 'cancelled';
      default:
        return true;
    }
  });
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);
  
  const handleViewingPress = (viewing: Viewing) => {
    navigation.navigate('ViewingDetail', { viewingId: viewing.id });
  };
  
  const handleReschedule = (viewing: Viewing) => {
    console.log('Reschedule viewing:', viewing.id);
    // TODO: Navigate to reschedule flow
  };
  
  const handleCancel = (viewing: Viewing) => {
    console.log('Cancel viewing:', viewing.id);
    // TODO: Show confirmation dialog
  };
  
  const renderEmptyState = () => {
    let message = '';
    let hint = '';
    let icon: React.ReactNode;
    
    switch (activeTab) {
      case 'upcoming':
        message = 'Nu ai vizionări programate';
        hint = 'Explorează proprietăți și programează vizionări';
        icon = <Calendar size={48} color={theme.colors.textTertiary} />;
        break;
      case 'past':
        message = 'Nu ai vizionări finalizate';
        hint = 'Vizionările tale trecute vor apărea aici';
        icon = <Clock size={48} color={theme.colors.textTertiary} />;
        break;
      case 'cancelled':
        message = 'Nu ai vizionări anulate';
        hint = 'Sperăm că toate vizionările tale merg conform planului!';
        icon = <XCircle size={48} color={theme.colors.textTertiary} />;
        break;
    }
    
    return (
      <View style={styles.emptyState}>
        {icon}
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
          {message}
        </Text>
        <Text style={[styles.emptyHint, { color: theme.colors.textSecondary }]}>
          {hint}
        </Text>
      </View>
    );
  };
  
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>
      {title}
    </Text>
  );

  // Group viewings by date
  const groupViewingsByDate = (viewingsList: Viewing[]) => {
    const groups: { [key: string]: Viewing[] } = {};
    
    viewingsList.forEach(viewing => {
      const slot = viewing.confirmedSlot || viewing.requestedSlots[0];
      const date = new Date(slot.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let key: string;
      if (slot.date === today.toISOString().split('T')[0]) {
        key = 'ASTĂZI';
      } else if (slot.date === tomorrow.toISOString().split('T')[0]) {
        key = 'MÂINE';
      } else {
        key = date.toLocaleDateString('ro-RO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).toUpperCase();
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(viewing);
    });
    
    return groups;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Vizionări
        </Text>
      </View>
      
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const iconColor = isActive ? '#fff' : theme.colors.textSecondary;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { backgroundColor: theme.colors.primary.main },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                color: iconColor,
              })}
              <Text style={[
                styles.tabText,
                { color: isActive ? '#fff' : theme.colors.textSecondary },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Viewings List */}
      <FlatList
        data={Object.entries(groupViewingsByDate(filteredViewings))}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, dateViewings] }) => (
          <View>
            {renderSectionHeader(date)}
            {dateViewings.map(viewing => (
              <ViewingCard
                key={viewing.id}
                viewing={viewing}
                onPress={() => handleViewingPress(viewing)}
                onReschedule={() => handleReschedule(viewing)}
                onCancel={() => handleCancel(viewing)}
                viewType="seeker"
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default ViewingsListScreen;
