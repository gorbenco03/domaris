"use client";

/**
 * RIVA Frontend - Filter Chips
 * Horizontal scrollable active filter chips + quick filters
 * Aligned with mobile/src/features/search/components/FilterChips.tsx + QuickFilters.tsx
 */

import { X, Sparkles, Clock, TrendingDown, CheckCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// ACTIVE FILTER CHIPS (shows applied filters)
// ============================================

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {filter.label}: {filter.value}
          <button
            onClick={() => onRemove(filter.key)}
            className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Șterge toate
        </button>
      )}
    </div>
  );
}

// ============================================
// QUICK FILTERS (toggleable preset filters)
// ============================================

export type QuickFilterId = "recommended" | "new" | "priceDropped" | "verified" | "nearby";

interface QuickFilter {
  id: QuickFilterId;
  label: string;
  icon: React.ElementType;
  activeColor: string;
  activeBg: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "recommended",
    label: "Recomandate AI",
    icon: Sparkles,
    activeColor: "text-violet-600",
    activeBg: "bg-violet-500/10 border-violet-500",
  },
  {
    id: "new",
    label: "Noi (7 zile)",
    icon: Clock,
    activeColor: "text-emerald-600",
    activeBg: "bg-emerald-500/10 border-emerald-500",
  },
  {
    id: "priceDropped",
    label: "Preț redus",
    icon: TrendingDown,
    activeColor: "text-amber-600",
    activeBg: "bg-amber-500/10 border-amber-500",
  },
  {
    id: "verified",
    label: "Proprietari verificați",
    icon: CheckCircle,
    activeColor: "text-blue-600",
    activeBg: "bg-blue-500/10 border-blue-500",
  },
  {
    id: "nearby",
    label: "În apropiere",
    icon: MapPin,
    activeColor: "text-rose-600",
    activeBg: "bg-rose-500/10 border-rose-500",
  },
];

interface QuickFiltersProps {
  selected: QuickFilterId[];
  onToggle: (id: QuickFilterId) => void;
}

export function QuickFilters({ selected, onToggle }: QuickFiltersProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Filtre rapide
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const isSelected = selected.includes(filter.id);
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => onToggle(filter.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all",
                isSelected
                  ? `${filter.activeBg} ${filter.activeColor} font-medium`
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
