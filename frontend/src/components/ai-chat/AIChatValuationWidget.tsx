"use client";

import { TrendingUp, BarChart3, AlertCircle } from "lucide-react";

// Shape coming from the legacy UI (old frontend-only use)
export interface ValuationResult {
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number; // 0-100 for legacy, 0-1 from backend
  comparables: {
    address?: string;
    price: number;
    area?: number;
    soldDate?: string;
    // backend shape
    count?: number;
    avgPrice?: number;
    avgPricePerSqm?: number;
  }[] | {
    count: number;
    avgPrice: number;
    avgPricePerSqm: number;
    medianPrice?: number;
  };
  // Fields from the real AVMResult backend response
  currency?: string;
  liquidityScore?: number;
  dealAttractivenessScore?: number;
  insufficientData?: boolean;
  factors?: Array<{ name: string; impact: number; description: string }>;
  explanation?: {
    summary?: string;
    priceJustification?: string;
    marketContext?: string;
    recommendations?: string[];
  };
}

interface AIChatValuationWidgetProps {
  valuation: ValuationResult;
}

export const AIChatValuationWidget = ({ valuation }: AIChatValuationWidgetProps) => {
  const formatPrice = (price: number, currency = "EUR") =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);

  // Normalise confidence: backend sends 0-1, legacy sends 0-100
  const confidencePct =
    valuation.confidence <= 1
      ? Math.round(valuation.confidence * 100)
      : Math.round(valuation.confidence);

  const rangeWidth = valuation.priceRange.max - valuation.priceRange.min;
  const position =
    rangeWidth > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((valuation.estimatedPrice - valuation.priceRange.min) / rangeWidth) * 100
          )
        )
      : 50;

  const currency = valuation.currency || "EUR";

  // Normalise comparables to a flat summary object
  const comps = valuation.comparables;
  let compSummary: { count: number; avgPrice: number; avgPricePerSqm: number } | null = null;
  let compList: Array<{ address?: string; price: number; area?: number; soldDate?: string }> = [];

  if (Array.isArray(comps)) {
    // Legacy array of individual comparables
    compList = comps as Array<{ address?: string; price: number; area?: number; soldDate?: string }>;
  } else if (comps && typeof comps === "object" && "count" in comps) {
    compSummary = comps as { count: number; avgPrice: number; avgPricePerSqm: number };
  }

  if (valuation.insufficientData) {
    return (
      <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Date insuficiente</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nu există suficiente comparabile în zonă pentru o estimare fiabilă. Încearcă să
              ajustezi criteriile sau revino mai târziu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 bg-primary/5 px-4 py-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Evaluare AVM</span>
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
          {confidencePct}% încredere
        </span>
      </div>

      {/* Price */}
      <div className="px-4 pt-4">
        <p className="text-xs text-muted-foreground">Preț estimat</p>
        <p className="text-2xl font-bold text-primary">
          {formatPrice(valuation.estimatedPrice, currency)}
        </p>
      </div>

      {/* Range bar */}
      <div className="px-4 py-3">
        <div className="relative h-2 rounded-full bg-muted">
          <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-accent/60 to-accent" />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-card shadow-sm"
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(valuation.priceRange.min, currency)}</span>
          <span>{formatPrice(valuation.priceRange.max, currency)}</span>
        </div>
      </div>

      {/* Liquidity / deal scores (backend only) */}
      {(valuation.liquidityScore !== undefined || valuation.dealAttractivenessScore !== undefined) && (
        <div className="flex gap-4 border-t border-border px-4 py-3">
          {valuation.liquidityScore !== undefined && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Lichiditate
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${valuation.liquidityScore}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {valuation.liquidityScore}/100
                </span>
              </div>
            </div>
          )}
          {valuation.dealAttractivenessScore !== undefined && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Atractivitate
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${valuation.dealAttractivenessScore}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {valuation.dealAttractivenessScore}/100
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanation summary (backend only) */}
      {valuation.explanation?.summary && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">{valuation.explanation.summary}</p>
        </div>
      )}

      {/* Comparables summary (backend) */}
      {compSummary && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            Comparabile ({compSummary.count} proprietăți)
          </p>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Preț mediu: </span>
              <span className="font-semibold">{formatPrice(compSummary.avgPrice, currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">€/m²: </span>
              <span className="font-semibold">{formatPrice(compSummary.avgPricePerSqm, currency)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparables list (legacy) */}
      {compList.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            Comparabile
          </p>
          <div className="space-y-2">
            {compList.map((comp, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
              >
                <div>
                  {comp.address && (
                    <p className="font-medium text-foreground">{comp.address}</p>
                  )}
                  {(comp.area || comp.soldDate) && (
                    <p className="text-muted-foreground">
                      {comp.area ? `${comp.area} m²` : ""}
                      {comp.area && comp.soldDate ? " · " : ""}
                      {comp.soldDate || ""}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-primary">{formatPrice(comp.price, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
