/**
 * IMOBI - Notifications Center Screen
 * Shows all notifications with grouping by date
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { NotificationItem } from '../components';
import { Notification } from '../types';
import { ArrowLeft, CheckCheck, Bell, Settings } from 'lucide-react-native';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1', userId: 'u1', type: 'message', title: 'Ion Popescu',
    body: 'Când putem programa vizionarea pentru apartamentul din Drumul Taberei?',
    read: false, channels: ['push', 'in_app'], deliveredVia: ['push'], createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: '2', userId: 'u1', type: 'viewing_confirmed', title: 'Vizionare confirmată',
    body: 'Casă Pipera - Mâine la 10:00',
    read: false, channels: ['push', 'in_app'], deliveredVia: ['push'], createdAt: new Date(Date.now() - 60 * 60000),
  },
  {
    id: '3', userId: 'u1', type: 'property_match', title: 'Proprietate nouă',
    body: 'Apartament 3 camere București potrivește căutării tale',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200',
    read: true, channels: ['push', 'in_app'], deliveredVia: ['in_app'], createdAt: new Date(Date.now() - 25 * 3600000),
  },
  {
    id: '4', userId: 'u1', type: 'price_change', title: 'Preț redus! 🎉',
    body: 'Studio Central a scazut prețul cu 5%',
    read: true, channels: ['push', 'in_app'], deliveredVia: ['push'], createdAt: new Date(Date.now() - 48 * 3600000),
  },
  {
    id: '5', userId: 'u1', type: 'viewing_reminder', title: 'Reminder vizionare',
    body: 'Vizionare mâine la 14:00 - Apartament Unirii',
    read: true, channels: ['push', 'in_app'], deliveredVia: ['push'], createdAt: new Date(Date.now() - 72 * 3600000),
  },
];

const NotificationsCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
  };

  const handleNotificationPress = (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true, readAt: new Date() } : n));
    // Navigate based on actionType
  };

  const groupByDate = (items: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach(item => {
      const dateStr = item.createdAt.toDateString();
      let key: string;
      if (dateStr === today) key = 'ASTĂZI';
      else if (dateStr === yesterday) key = 'IERI';
      else key = item.createdAt.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.divider }]}>
        <Bell size={40} color={theme.colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Nicio notificare</Text>
      <Text style={[styles.emptyHint, { color: theme.colors.textSecondary }]}>Vei primi notificări despre mesaje, vizionări și altele</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Notificări</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.accent.main }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerBtn}>
              <CheckCheck size={22} color={theme.colors.accent.main} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings' as never)} style={styles.headerBtn}>
            <Settings size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groupByDate(notifications)}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, items] }) => (
          <View>
            <Text style={[styles.sectionHeader, { color: theme.colors.textTertiary }]}>{date}</Text>
            {items.map(n => (
              <NotificationItem key={n.id} notification={n} onPress={() => handleNotificationPress(n)} />
            ))}
          </View>
        )}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.main} />}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 24 },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

export default NotificationsCenterScreen;
