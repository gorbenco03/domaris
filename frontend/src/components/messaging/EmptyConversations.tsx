'use client';

/**
 * Empty Conversations Component
 * Empty state display when no conversations match the filter
 */

import React from 'react';
import { MessageCircle, Inbox, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

export type ConversationFilter = 'all' | 'unread' | 'archived';

interface EmptyConversationsProps {
  filter: ConversationFilter;
  onSearchProperties?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function EmptyConversations({
  filter,
  onSearchProperties,
}: EmptyConversationsProps) {
  const getContent = () => {
    switch (filter) {
      case 'unread':
        return {
          icon: <Inbox className="w-16 h-16 text-muted-foreground/50 stroke-[1.5]" />,
          title: 'Niciun mesaj necitit',
          description: 'Ești la zi cu toate conversațiile tale.',
        };
      case 'archived':
        return {
          icon: <Archive className="w-16 h-16 text-muted-foreground/50 stroke-[1.5]" />,
          title: 'Nicio conversație arhivată',
          description: 'Conversațiile arhivate vor apărea aici.',
        };
      default:
        return {
          icon: <MessageCircle className="w-16 h-16 text-muted-foreground/50 stroke-[1.5]" />,
          title: 'Nicio conversație încă',
          description: 'Contactează proprietarii pentru a începe o conversație despre proprietățile care te interesează.',
          showAction: true,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {/* Icon */}
      <div className="w-30 h-30 rounded-full bg-primary/5 flex items-center justify-center mb-6">
        {content.icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {content.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed">
        {content.description}
      </p>

      {/* Action button */}
      {content.showAction && (
        <div className="mt-6">
          {onSearchProperties ? (
            <Button onClick={onSearchProperties}>
              Caută proprietăți
            </Button>
          ) : (
            <Button asChild>
              <Link href="/search">Caută proprietăți</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyConversations;
