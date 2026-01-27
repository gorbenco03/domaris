import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { propertiesApi } from '@/features/properties/api/propertiesApi';
import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import {
  PropertyAnalytics,
  AnalyticsSuggestion,
  OwnerAnalyticsSummary,
} from '../types';

const PERIOD_MAP: Record<string, '7d' | '30d' | 'all'> = {
  week: '7d',
  month: '30d',
  all_time: 'all',
};

const normalizeAnalytics = (
  propertyId: string,
  period: '7d' | '30d' | 'all',
  payload: any
): PropertyAnalytics => {
  const viewsTotal = payload?.views_total ?? payload?.views ?? 0;
  const favoritesTotal = payload?.favorites_total ?? payload?.favorites ?? 0;
  const uniqueViews = payload?.views_unique ?? payload?.uniqueViews ?? 0;

  return {
    propertyId,
    period: period === '7d' ? 'week' : period === '30d' ? 'month' : 'all_time',
    impressions: payload?.impressions ?? 0,
    views: viewsTotal,
    uniqueViews,
    favorites: favoritesTotal,
    contacts: payload?.contacts ?? 0,
    viewingsRequested: payload?.viewingsRequested ?? 0,
    viewingsCompleted: payload?.viewingsCompleted ?? 0,
    shares: payload?.shares ?? 0,
    ctr: payload?.ctr ?? 0,
    contactRate: payload?.contactRate ?? 0,
    viewingRate: payload?.viewingRate ?? 0,
    timeline: Array.isArray(payload?.timeline) ? payload.timeline : [],
    sources: payload?.sources ?? {
      search: 0,
      alerts: 0,
      direct: 0,
      favorites: 0,
    },
    avgSearchPosition: payload?.avgSearchPosition,
    trends: payload?.trends ?? {
      viewsChange: 0,
      contactsChange: 0,
      viewingsChange: 0,
    },
    benchmark: payload?.benchmark,
  };
};

export const usePropertyAnalytics = (
  propertyId: string,
  period: string = 'week'
) => {
  const mappedPeriod = PERIOD_MAP[period] ?? '7d';

  const query = useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, 'analytics', propertyId, mappedPeriod],
    queryFn: async () => {
      const data = await propertiesApi.getPropertyAnalytics(
        propertyId,
        mappedPeriod
      );
      return normalizeAnalytics(propertyId, mappedPeriod, data);
    },
    enabled: !!propertyId,
  });

  return { data: query.data, loading: query.isLoading };
};

export const useAnalyticsSuggestions = (propertyId: string) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, 'analytics', propertyId, 'suggestions'],
    queryFn: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.ANALYTICS.PROPERTY_SUGGESTIONS(String(propertyId))
      );
      const recommendations = response.data?.recommendations || [];

      return recommendations.map((message: string, index: number) => ({
        id: `${propertyId}-${index}`,
        type: 'description',
        priority: 'medium',
        message,
        description: message,
        action: 'Vezi detalii',
      })) as AnalyticsSuggestion[];
    },
    enabled: !!propertyId,
  });

  return { suggestions: query.data ?? [], loading: query.isLoading };
};

export const useOwnerAnalyticsSummary = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PROFILE, 'analytics', 'summary'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.OWNER_SUMMARY);
      const payload = response.data || {};

      const totalViews = payload.totalViews ?? 0;
      const totalLeads = payload.totalLeads ?? 0;
      const top = payload.listingsPerformance?.[0];

      const summary: OwnerAnalyticsSummary = {
        totalViews,
        totalContacts: payload.totalContacts ?? totalLeads ?? 0,
        scheduledViewings: payload.scheduledViewings ?? totalLeads ?? 0,
        topPerforming: {
          id: String(top?.id ?? 'none'),
          title: top?.title ?? '—',
          views: top?.views ?? 0,
        },
        needsAttention: {
          id: String(payload.needsAttention?.id ?? 'none'),
          title: payload.needsAttention?.title ?? '—',
          issue: payload.needsAttention?.issue ?? '—',
        },
      };

      return summary;
    },
  });

  return {
    summary: query.data ?? null,
    loading: query.isLoading,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};
