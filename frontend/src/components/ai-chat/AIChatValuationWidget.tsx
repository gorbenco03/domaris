"use client";

import { TrendingUp, BarChart3 } from "lucide-react";

export interface ValuationResult {
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  comparables: {
    address: string;
    price: number;
    area: number;
    soldDate: string;
  }[];
}

interface AIChatValuationWidgetProps {
  valuation: ValuationResult;
}

export const AIChatValuationWidget = ({ valuation }: AIChatValuationWidgetProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

  // Calculate where the estimated price sits in the range
  const rangeWidth = valuation.priceRange.max - valuation.priceRange.min;
  const position = ((valuation.estimatedPrice - valuation.priceRange.min) / rangeWidth) * 100;

  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 bg-primary/5 px-4 py-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Evaluare AVM</span>
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
          {valuation.confidence}% încredere
        </span>
      </div>

      {/* Price */}
      <div className="px-4 pt-4">
        <p className="text-xs text-muted-foreground">Preț estimat</p>
        <p className="text-2xl font-bold text-primary">{formatPrice(valuation.estimatedPrice)}</p>
      </div>

      {/* Range bar */}
      <div className="px-4 py-3">
        <div className="relative h-2 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-accent/60 to-accent"
            style={{ left: "0%", right: "0%" }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-card shadow-sm"
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(valuation.priceRange.min)}</span>
          <span>{formatPrice(valuation.priceRange.max)}</span>
        </div>
      </div>

      {/* Comparables */}
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-accent" />
          Comparabile
        </p>
        <div className="space-y-2">
          {valuation.comparables.map((comp, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-medium text-foreground">{comp.address}</p>
                <p className="text-muted-foreground">{comp.area} m² · {comp.soldDate}</p>
              </div>
              <span className="font-semibold text-primary">{formatPrice(comp.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
