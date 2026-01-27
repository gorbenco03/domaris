'use client';

/**
 * Conversation Item Component
 * Single conversation preview in the list
 */

import React from 'react';
import { Home, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

// ============================================
// TYPES
// ============================================

interface ConversationItemProps {
  conversation: {
    id: string;
    unreadCount: number;
    status: string;
    otherParticipant?: {
      name?: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      isOnline?: boolean;
    };
    property?: {
      title?: string;
    };
    lastMessage?: {
      content?: string;
      text?: string;
      createdAt?: string | Date;
      sentAt?: string | Date;
    };
  };
  onPress: (conversationId: string) => void;
  isSelected?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ConversationItem({
  conversation,
  onPress,
  isSelected = false,
}: ConversationItemProps) {
  const hasUnread = conversation.unreadCount > 0;
  const avatarUrl = conversation.otherParticipant?.avatar;
  const p = conversation.otherParticipant;
  const participantName = p?.name || (p?.firstName ? `${p.firstName} ${p.lastName}` : 'Utilizator');
  const propertyTitle = conversation.property?.title || 'Proprietate';
  const lastMessageText = conversation.lastMessage?.content || conversation.lastMessage?.text || '';
  const lastMessageTime = conversation.lastMessage?.createdAt || conversation.lastMessage?.sentAt;
  const formattedTime = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true, locale: ro })
    : '';
  const isArchived = conversation.status === 'ARCHIVED' || conversation.status === 'archived';

  // Truncate last message
  const truncatedMessage = lastMessageText.length > 40 
    ? `${lastMessageText.substring(0, 40)}...` 
    : lastMessageText;

  return (
    <button
      className={cn(
        'w-full text-left flex gap-3 p-4 border-b transition-colors hover:bg-muted/50',
        hasUnread && 'bg-primary/5',
        isSelected && 'bg-primary/10',
        isArchived && 'opacity-60'
      )}
      onClick={() => onPress(conversation.id)}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="w-13 h-13">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={participantName} />
          ) : null}
          <AvatarFallback className="bg-primary/20">
            <User className="w-6 h-6 text-primary" />
          </AvatarFallback>
        </Avatar>
        {/* Online indicator */}
        {conversation.otherParticipant?.isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={cn(
              'text-sm truncate',
              hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground'
            )}
          >
            {participantName}
          </span>
          <span
            className={cn(
              'text-xs shrink-0',
              hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'
            )}
          >
            {formattedTime}
          </span>
        </div>

        {/* Property row */}
        <div className="flex items-center gap-1 mb-1">
          <Home className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate flex-1">
            {propertyTitle}
          </span>
          {isArchived && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Arhivat
            </Badge>
          )}
        </div>

        {/* Message preview row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {truncatedMessage}
          </span>
          {hasUnread && (
            <Badge className="shrink-0 min-w-[20px] h-5 rounded-full text-[11px] font-bold">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
