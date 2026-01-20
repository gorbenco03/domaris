/**
 * Analytics feature types
 */

export interface PropertyAnalytics {
  propertyId: string;
  period: "day" | "week" | "month" | "all_time";

  // Core metrics
  impressions: number; // Apariții în liste
  views: number; // Click pe anunț
  uniqueViews: number; // Vizitatori unici
  favorites: number; // Salvări
  contacts: number; // Mesaje inițiate
  viewingsRequested: number;
  viewingsCompleted: number;
  shares: number;

  // Rates
  ctr: number; // views / impressions
  contactRate: number; // contacts / views
  viewingRate: number; // viewings / contacts

  // Time series
  timeline: {
    date: string;
    views: number;
    contacts: number;
  }[];

  // Sources
  sources: {
    search: number;
    alerts: number;
    direct: number;
    favorites: number;
  };

  // Position
  avgSearchPosition?: number;

  // Comparison/Trends
  trends: {
    viewsChange: number; // percentage
    contactsChange: number; // percentage
    viewingsChange: number; // percentage
  };

  // Benchmark
  benchmark?: {
    avgViews: number;
    avgContacts: number;
    percentile: number; // 0-100
    marketStatus: string;
  };
}

export interface AnalyticsSuggestion {
  id: string;
  type: "photos" | "price" | "description" | "availability";
  priority: "high" | "medium" | "low";
  message: string;
  description: string;
  action?: string;
}

export interface OwnerAnalyticsSummary {
  totalViews: number;
  totalContacts: number;
  scheduledViewings: number;
  topPerforming: {
    id: string;
    title: string;
    views: number;
  };
  needsAttention: {
    id: string;
    title: string;
    issue: string;
  };
}
