/**
 * RIVA - Notifications Center Screen
 * Shows all notifications with grouping by date
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { NotificationItem } from '../components';
import { Notification } from '../types';
import { CheckCheck, Bell, Settings } from 'lucide-react-native';
import { ScreenHeader } from '@/shared/components';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../hooks/useNotifications';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const NotificationsCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  // Fetch notifications from API
  const {
    data: notifications = [],
    isLoading,
    refetch,
    isFetching,
  } = useNotifications();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Map API notifications to UI type
  const mappedNotifications: Notification[] = useMemo(() => {
    return notifications.map((n: any) => ({
      id: String(n.id),
      userId: String(n.userId),
      type: n.type.toLowerCase().replace(/_/g, '_') as any,
      title: n.title,
      body: n.body, // Backend returns 'body' not 'message'
      read: n.isRead,
      readAt: n.isRead ? new Date() : undefined,
      channels: ['push', 'in_app'],
      deliveredVia: ['push'],
      createdAt: new Date(n.createdAt),
      actionType: n.metadata?.actionType || n.metadata?.type,
      actionData: n.metadata, // Backend returns 'metadata' not 'data'
      imageUrl: n.metadata?.imageUrl,
    }));
  }, [notifications]);

  const unreadCount = useMemo(
    () => mappedNotifications.filter((n) => !n.read).length,
    [mappedNotifications]
  );

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Mark all as read failed:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markAsReadMutation.mutateAsync(Number(notification.id));
      } catch (error) {
        console.error('Mark as read failed:', error);
      }
    }

    // Navigate based on notification type
    const { actionData } = notification;
    const notificationType = notification.type;

    if (notificationType === 'feedback_request' && actionData?.viewingId) {
      // Navigate to viewing detail to leave feedback
      navigation.navigate('ViewingDetail', { viewingId: String(actionData.viewingId) });
    } else if (notificationType === 'new_review' && actionData?.viewingId) {
      // Navigate to reviews screen
      navigation.navigate('Reviews', { isOwnProfile: true });
    } else if (notificationType === 'review_response') {
      // Navigate to reviews screen
      navigation.navigate('Reviews', { isOwnProfile: true });
    } else if (notificationType === 'viewing_reminder' && actionData?.viewingId) {
      navigation.navigate('ViewingDetail', { viewingId: String(actionData.viewingId) });
    } else if (actionData?.propertyId) {
      // Generic property-related notification
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'SearchTab',
            params: {
              screen: 'PropertyDetail',
              params: { propertyId: String(actionData.propertyId) },
            },
          },
        })
      );
    }
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

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Se încarcă notificările...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader
        title="Notificări"
        rightSlot={
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.accent.main }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.headerBtn}>
                <CheckCheck size={22} color={theme.colors.accent.main} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'Main',
                    params: {
                      screen: 'ProfileTab',
                      params: {
                        screen: 'NotificationSettings',
                      },
                    },
                  })
                );
              }}
              style={styles.headerBtn}
            >
              <Settings size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        }
      />

      <FlatList
        data={groupByDate(mappedNotifications)}
        keyExtractor={([date]) => date}
        horizontal={false}
        renderItem={({ item: [date, items] }) => (
          <View style={{ width: '100%' }}>
            <Text style={[styles.sectionHeader, { color: theme.colors.textTertiary }]}>
              {date}
            </Text>
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onPress={() => handleNotificationPress(n)}
              />
            ))}
          </View>
        )}
        contentContainerStyle={
          mappedNotifications.length === 0 
            ? [styles.emptyContainer, { width: '100%' }] 
            : [styles.listContent, { width: '100%' }]
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
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
  container: { flex: 1 },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 24 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

export default NotificationsCenterScreen;
