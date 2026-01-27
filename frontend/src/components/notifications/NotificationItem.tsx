'use client';

/**
 * Notification Item Component
 * Individual notification with icon, title, body, and time
 */

import React from 'react';
import {
  MessageCircle,
  Calendar,
  XCircle,
  Clock,
  Home,
  TrendingDown,
  AlertCircle,
  Shield,
  Smartphone,
  Gift,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NOTIFICATION_TYPE_INFO, NotificationType } from '@/features/notifications/types';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

// Map backend types to mobile types
const mapNotificationType = (type: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    'new_message': 'message',
    'verification_approved': 'verification_complete',
    'verification_rejected': 'verification_complete',
    'property_favorited': 'property_match',
    'property_inquiry': 'message',
    'system': 'promotion',
  };
  return (typeMap[type] || type) as NotificationType;
};

const DEFAULT_TYPE_INFO = { icon: 'bell', color: '#6366f1', label: 'Notificare' };

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const mappedType = mapNotificationType(notification.type);
  const typeInfo = NOTIFICATION_TYPE_INFO[mappedType] || DEFAULT_TYPE_INFO;

  const getIcon = () => {
    const className = 'w-5 h-5';
    const style = { color: typeInfo.color };
    
    switch (mappedType) {
      case 'message': return <MessageCircle className={className} style={style} />;
      case 'viewing_request':
      case 'viewing_confirmed': return <Calendar className={className} style={style} />;
      case 'viewing_cancelled': return <XCircle className={className} style={style} />;
      case 'viewing_reminder': return <Clock className={className} style={style} />;
      case 'property_match': return <Home className={className} style={style} />;
      case 'price_change': return <TrendingDown className={className} style={style} />;
      case 'property_unavailable': return <AlertCircle className={className} style={style} />;
      case 'verification_complete': return <Shield className={className} style={style} />;
      case 'new_device_login': return <Smartphone className={className} style={style} />;
      case 'promotion': return <Gift className={className} style={style} />;
      default: return <Bell className={className} style={style} />;
    }
  };

  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ro,
  });

  return (
    <button
      className={cn(
        'w-full text-left flex items-start gap-3 py-3.5 px-4 transition-colors hover:bg-muted/50',
        !notification.read && 'bg-primary/5'
      )}
      onClick={onPress}
    >
      {/* Unread indicator */}
      <div className="w-3 pt-2 shrink-0">
        {!notification.read && (
          <span className="block w-2 h-2 rounded-full bg-primary" />
        )}
      </div>

      {/* Icon container */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: typeInfo.color + '15' }}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formattedTime}
        </p>
      </div>

      {/* Optional image */}
      {notification.imageUrl && (
        <img
          src={notification.imageUrl}
          alt=""
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      )}
    </button>
  );
}

export default NotificationItem;
