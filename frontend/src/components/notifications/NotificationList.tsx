'use client';

/**
 * Notification List Component
 * List of notifications with empty state
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/features/notifications/types';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
  maxHeight?: string;
}

export function NotificationList({
  notifications,
  onNotificationPress,
  maxHeight = '500px',
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Bell className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Nicio notificare
        </h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          Notificările tale vor apărea aici când ai mesaje noi, vizionări sau actualizări.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="divide-y">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={() => onNotificationPress?.(notification)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export default NotificationList;
