import { useState, useEffect } from 'react';
import { PropertyAnalytics, AnalyticsSuggestion, OwnerAnalyticsSummary } from '../types';

export const usePropertyAnalytics = (propertyId: string, period: string = 'week') => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PropertyAnalytics | null>(null);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setData({
        propertyId,
        period: period as any,
        impressions: 2450,
        views: 234,
        uniqueViews: 180,
        favorites: 45,
        contacts: 12,
        viewingsRequested: 8,
        viewingsCompleted: 5,
        shares: 24,
        ctr: 9.5,
        contactRate: 5.1,
        viewingRate: 41.6,
        timeline: [
          { date: 'L', views: 25, contacts: 1 },
          { date: 'M', views: 42, contacts: 2 },
          { date: 'Mi', views: 35, contacts: 1 },
          { date: 'J', views: 48, contacts: 3 },
          { date: 'V', views: 30, contacts: 0 },
          { date: 'S', views: 28, contacts: 2 },
          { date: 'D', views: 26, contacts: 3 },
        ],
        sources: {
          search: 65,
          alerts: 15,
          direct: 10,
          favorites: 10,
        },
        avgSearchPosition: 4.2,
        trends: {
          viewsChange: 15,
          contactsChange: 8,
          viewingsChange: 0,
        },
        benchmark: {
          avgViews: 180,
          avgContacts: 8,
          percentile: 75,
          marketStatus: 'top 25%',
        },
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [propertyId, period]);

  return { data, loading };
};

export const useAnalyticsSuggestions = (propertyId: string) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<AnalyticsSuggestion[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestions([
        {
          id: '1',
          type: 'photos',
          priority: 'high',
          message: 'Adaugă mai multe poze',
          description: 'Anunțurile cu 10+ poze au cu 40% mai multe contacte.',
          action: 'Adaugă poze',
        },
        {
          id: '2',
          type: 'price',
          priority: 'medium',
          message: 'Verifică prețul',
          description: 'Prețul tău e cu 5% peste media zonei Drumul Taberei.',
          action: 'Vezi comparație',
        },
      ]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [propertyId]);

  return { suggestions, loading };
};

export const useOwnerAnalyticsSummary = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<OwnerAnalyticsSummary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary({
        totalViews: 1234,
        totalContacts: 45,
        scheduledViewings: 12,
        topPerforming: {
          id: 'prop-1',
          title: 'Apartament 3 cam. Drumul Taberei',
          views: 456,
        },
        needsAttention: {
          id: 'prop-2',
          title: 'Casă Pipera',
          issue: '0 contacte în ultima săptămână',
        },
      });
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return { summary, loading };
};
