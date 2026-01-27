'use client';

/**
 * Filter Tabs Component
 * Horizontal tabs for filtering conversations (All, Unread, Archived)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ============================================
// TYPES
// ============================================

export type ConversationFilter = 'all' | 'unread' | 'archived';

interface FilterTab {
  key: ConversationFilter;
  label: string;
  badge?: number;
}

interface FilterTabsProps {
  activeFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  unreadCount?: number;
}

// ============================================
// COMPONENT
// ============================================

export function FilterTabs({
  activeFilter,
  onFilterChange,
  unreadCount = 0,
}: FilterTabsProps) {
  const tabs: FilterTab[] = [
    { key: 'all', label: 'Toate' },
    { key: 'unread', label: 'Necitite', badge: unreadCount },
    { key: 'archived', label: 'Arhivate' },
  ];

  return (
    <div className="border-b bg-white">
      <div className="flex relative">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;

          return (
            <button
              key={tab.key}
              className={cn(
                'flex-1 py-3.5 flex items-center justify-center gap-1.5 relative transition-colors',
                isActive 
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground font-medium hover:text-foreground'
              )}
              onClick={() => onFilterChange(tab.key)}
            >
              <span className="text-sm">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={cn(
                    'min-w-[20px] h-[18px] rounded-full text-[11px] font-bold px-1.5',
                    !isActive && 'bg-muted-foreground/20 text-muted-foreground'
                  )}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Badge>
              )}
              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FilterTabs;
