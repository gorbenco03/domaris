'use client';

/**
 * Viewings List Component
 * List of viewings with empty state and status filters
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { ViewingCard } from './ViewingCard';
import { Viewing } from '@/features/viewings/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ViewingsListProps {
  viewings: Viewing[];
  viewType?: 'seeker' | 'owner';
  onReschedule?: (viewing: Viewing) => void;
  onCancel?: (viewing: Viewing) => void;
  showActions?: boolean;
}

export function ViewingsList({
  viewings,
  viewType = 'seeker',
  onReschedule,
  onCancel,
  showActions = true,
}: ViewingsListProps) {
  if (viewings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Calendar className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nicio vizionare programată
        </h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
          {viewType === 'seeker'
            ? 'Explorează proprietăți și programează o vizionare pentru a vedea locuința dorită.'
            : 'Vizionările programate de către chiriași vor apărea aici.'}
        </p>
        {viewType === 'seeker' && (
          <Button asChild>
            <Link href="/search">Caută proprietăți</Link>
          </Button>
        )}
      </div>
    );
  }

  // Group viewings by status
  const upcomingViewings = viewings.filter(
    (v) => v.status === 'pending' || v.status === 'confirmed' || v.status === 'rescheduled'
  );
  const pastViewings = viewings.filter(
    (v) => v.status === 'completed' || v.status === 'cancelled' || v.status === 'no_show'
  );

  return (
    <div className="space-y-8">
      {/* Upcoming viewings */}
      {upcomingViewings.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Vizionări viitoare
          </h3>
          <div className="space-y-4">
            {upcomingViewings.map((viewing) => (
              <ViewingCard
                key={viewing.id}
                viewing={viewing}
                viewType={viewType}
                showActions={showActions}
                onReschedule={() => onReschedule?.(viewing)}
                onCancel={() => onCancel?.(viewing)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past viewings */}
      {pastViewings.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Istoric
          </h3>
          <div className="space-y-4">
            {pastViewings.map((viewing) => (
              <ViewingCard
                key={viewing.id}
                viewing={viewing}
                viewType={viewType}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewingsList;
