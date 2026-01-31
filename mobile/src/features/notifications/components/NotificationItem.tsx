/**
 * RIVA - Notification Item Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Notification, NOTIFICATION_TYPE_INFO } from '../types';
import { MessageCircle, Calendar, CheckCircle, XCircle, Clock, Home, TrendingDown, AlertCircle, Shield, Smartphone, Gift, Bell } from 'lucide-react-native';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

// Map backend types to mobile types
const mapNotificationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'new_message': 'message',
    'verification_approved': 'verification_complete',
    'verification_rejected': 'verification_complete',
    'property_favorited': 'property_match',
    'property_inquiry': 'message',
    'system': 'promotion',
  };
  return typeMap[type] || type;
};

// Default fallback for unknown types
const DEFAULT_TYPE_INFO = { icon: 'bell', color: '#6366f1', label: 'Notificare' };

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const { theme } = useTheme();
  const mappedType = mapNotificationType(notification.type);
  const typeInfo = NOTIFICATION_TYPE_INFO[mappedType as keyof typeof NOTIFICATION_TYPE_INFO] || DEFAULT_TYPE_INFO;

  const getIcon = () => {
    const props = { size: 20, color: typeInfo.color };
    switch (mappedType) {
      case 'message': return <MessageCircle {...props} />;
      case 'viewing_request':
      case 'viewing_confirmed': return <Calendar {...props} />;
      case 'viewing_cancelled': return <XCircle {...props} />;
      case 'viewing_reminder': return <Clock {...props} />;
      case 'property_match': return <Home {...props} />;
      case 'price_change': return <TrendingDown {...props} />;
      case 'property_unavailable': return <AlertCircle {...props} />;
      case 'verification_complete': return <Shield {...props} />;
      case 'new_device_login': return <Smartphone {...props} />;
      case 'promotion': return <Gift {...props} />;
      default: return <Bell {...props} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'acum';
    if (minutes < 60) return `acum ${minutes}m`;
    if (hours < 24) return `acum ${hours}h`;
    if (days === 1) return 'ieri';
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: notification.read ? 'transparent' : theme.colors.accent.main + '08' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.unreadIndicator}>
        {!notification.read && <View style={[styles.dot, { backgroundColor: theme.colors.accent.main }]} />}
      </View>
      
      <View style={[styles.iconContainer, { backgroundColor: typeInfo.color + '15' }]}>
        {getIcon()}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
          {formatTime(notification.createdAt)}
        </Text>
      </View>
      
      {notification.imageUrl && (
        <Image source={{ uri: notification.imageUrl }} style={styles.image} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16 },
  unreadIndicator: { width: 12, height: '100%', alignItems: 'center', paddingTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  time: { fontSize: 12 },
  image: { width: 48, height: 48, borderRadius: 8, marginLeft: 12 },
});

export default NotificationItem;
