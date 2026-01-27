'use client';

/**
 * Viewings Page
 * Shows all viewing appointments with tabs for upcoming/past
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewingCard } from '@/components/viewings/ViewingCard';
import { Viewing } from '@/features/viewings/types';
import { viewingsApi } from '@/features/viewings/api';
import Link from 'next/link';

export default function ViewingsPage() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViewings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await viewingsApi.getViewings();
      setViewings(data);
    } catch (err) {
      console.error('Failed to fetch viewings:', err);
      setError('Nu s-au putut încărca vizionările. Te rugăm să încerci din nou.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViewings();
  }, [fetchViewings]);

  const handleReschedule = (viewing: Viewing) => {
    // TODO: Open reschedule modal
    console.log('Reschedule:', viewing.id);
  };

  const handleCancel = async (viewing: Viewing) => {
    if (confirm('Ești sigur că vrei să anulezi această vizionare?')) {
      try {
        await viewingsApi.cancelViewing(viewing.id);
        setViewings(viewings.map((v) =>
          v.id === viewing.id ? { ...v, status: 'cancelled' as const } : v
        ));
      } catch (err) {
        console.error('Failed to cancel viewing:', err);
      }
    }
  };

  const upcomingViewings = viewings.filter(
    (v) => v.status === 'pending' || v.status === 'confirmed' || v.status === 'rescheduled'
  );
  const pastViewings = viewings.filter(
    (v) => v.status === 'completed' || v.status === 'cancelled' || v.status === 'no_show'
  );

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vizionări</h1>
          <p className="text-muted-foreground text-sm">
            Gestionează programările tale
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="w-4 h-4" />
            Viitoare ({upcomingViewings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="w-4 h-4" />
            Istoric ({pastViewings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={fetchViewings}>
                  Încearcă din nou
                </Button>
              </CardContent>
            </Card>
          ) : upcomingViewings.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Nicio vizionare programată
                </h3>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto mb-6">
                  Explorează proprietăți și programează o vizionare pentru a
                  vedea locuința dorită.
                </p>
                <Button asChild>
                  <Link href="/search">Caută proprietăți</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingViewings.map((viewing) => (
                <ViewingCard
                  key={viewing.id}
                  viewing={viewing}
                  showActions
                  onReschedule={() => handleReschedule(viewing)}
                  onCancel={() => handleCancel(viewing)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastViewings.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nicio vizionare în istoric</h3>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto">
                  Vizionările finalizate sau anulate vor apărea aici.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastViewings.map((viewing) => (
                <ViewingCard
                  key={viewing.id}
                  viewing={viewing}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
