'use client';

/**
 * Chat Header Component
 * Header for the chat screen showing participant info and property
 */

import React from 'react';
import { ArrowLeft, Phone, MoreVertical, User, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface Participant {
  id?: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface PropertyPreview {
  id: string;
  title: string;
  price: number;
  currency: 'EUR' | 'RON';
}

interface ChatHeaderProps {
  participant: Participant;
  property?: PropertyPreview;
  onBack?: () => void;
  backHref?: string;
  onCallPress?: () => void;
  onArchive?: () => void;
  onBlock?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ChatHeader({
  participant,
  property,
  onBack,
  backHref = '/messages',
  onCallPress,
  onArchive,
  onBlock,
}: ChatHeaderProps) {
  const formatPrice = (price: number, currency: 'EUR' | 'RON') => {
    const symbol = currency === 'EUR' ? '€' : ' lei';
    return `${price.toLocaleString('ro-RO')}${symbol}`;
  };

  const BackButton = onBack ? (
    <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
      <ArrowLeft className="w-5 h-5" />
    </Button>
  ) : (
    <Button variant="ghost" size="icon" asChild className="shrink-0">
      <Link href={backHref}>
        <ArrowLeft className="w-5 h-5" />
      </Link>
    </Button>
  );

  return (
    <div className="border-b bg-white shadow-sm">
      {/* Main header row */}
      <div className="flex items-center gap-2 px-2 py-2.5">
        {/* Back button */}
        {BackButton}

        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="w-10 h-10">
            {participant.avatar ? (
              <AvatarImage src={participant.avatar} alt={participant.name} />
            ) : null}
            <AvatarFallback className="bg-primary/20">
              <User className="w-4 h-4 text-primary" />
            </AvatarFallback>
          </Avatar>
          {participant.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Participant info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {participant.name}
          </p>
          <p
            className={cn(
              'text-xs font-medium',
              participant.isOnline ? 'text-green-500' : 'text-muted-foreground'
            )}
          >
            {participant.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {onCallPress && (
            <Button variant="ghost" size="icon" onClick={onCallPress}>
              <Phone className="w-5 h-5 text-primary" />
            </Button>
          )}
          {(onArchive || onBlock) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onArchive && (
                  <DropdownMenuItem onClick={onArchive}>
                    Arhivează conversația
                  </DropdownMenuItem>
                )}
                {onBlock && (
                  <DropdownMenuItem onClick={onBlock} className="text-destructive">
                    Blochează utilizatorul
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Property preview row */}
      {property && (
        <Link
          href={`/property/${property.id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-t hover:bg-muted/50 transition-colors"
        >
          <Home className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate flex-1">
            {property.title}
          </span>
          <span className="text-sm font-semibold text-primary shrink-0">
            {formatPrice(property.price, property.currency)}
          </span>
        </Link>
      )}
    </div>
  );
}

export default ChatHeader;
