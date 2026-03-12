"use client";

/**
 * RIVA Frontend - AI Property Insights Page
 * AI-generated summary & insights for property viewers
 * Aligned with mobile/src/features/ai/screens/PropertyInsightsScreen.tsx
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Star,
  RefreshCw,
  Building,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPropertyDetail, PropertyListing } from "@/lib/propertiesApi";
import { getPropertySummary, getListingValuation, AVMResponse } from "@/lib/aiApi";

export default function PropertyInsightsPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: isAuthLoading } = useAuth();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [summary, setSummary] = useState<{
    summary: string;
    highlights: string[];
    concerns: string[];
  } | null>(null);
  const [valuation, setValuation] = useState<AVMResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const prop = await getPropertyDetail(id);
      setProperty(prop);

      const [summaryData, valuationData] = await Promise.all([
        getPropertySummary(Number(id)).catch(() => null),
        getListingValuation(Number(id)).catch(() => null),
      ]);

      if (summaryData) setSummary(summaryData);
      if (valuationData) setValuation(valuationData);
    } catch {
      setError("Nu am putut încărca datele.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) fetchData();
  }, [id, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 p-3">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Se generează rezumatul AI...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{error || "Proprietatea nu a fost găsită."}</p>
          <Button asChild className="mt-6"><Link href="/search">Înapoi la căutare</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/property/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la proprietate
          </Link>
        </div>

        {/* Title with AI gradient badge */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 p-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI despre proprietate</h1>
            <p className="text-sm text-muted-foreground">{property.title}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Property Quick Info */}
          <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              {property.rooms} camere · {property.surfaceSqm} m²
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              {(property.priceEur ?? 0).toLocaleString()} €
              {property.transactionType === "RENT" && "/lună"}
            </div>
          </div>

          {/* AI Summary */}
          {summary ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Rezumat AI</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{summary.summary}</p>
              </div>

              {/* Highlights */}
              {summary.highlights.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-semibold">Puncte forte</h2>
                  </div>
                  <ul className="space-y-3">
                    {summary.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {summary.concerns.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold">Aspecte de verificat</h2>
                  </div>
                  <ul className="space-y-3">
                    {summary.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card py-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Rezumatul AI nu este disponibil.</p>
              <Button variant="outline" onClick={fetchData} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Încearcă din nou
              </Button>
            </div>
          )}

          {/* AVM Valuation */}
          {valuation && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Estimare de preț</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Minim</p>
                  <p className="text-lg font-semibold">{(valuation.valuation.priceRange.min ?? 0).toLocaleString()} €</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Recomandat</p>
                  <p className="text-xl font-bold text-primary">{(valuation.valuation.recommendedPrice ?? 0).toLocaleString()} €</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Maxim</p>
                  <p className="text-lg font-semibold">{(valuation.valuation.priceRange.max ?? 0).toLocaleString()} €</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Încredere: {Math.round(valuation.valuation.confidence * 100)}%</span>
                <span>·</span>
                <span>Lichiditate: {Math.round(valuation.valuation.liquidityScore * 100)}%</span>
                {valuation.valuation.comparables.count > 0 && (
                  <>
                    <span>·</span>
                    <span>{valuation.valuation.comparables.count} comparabile</span>
                  </>
                )}
              </div>

              {valuation.explanation && (
                <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Explicație</p>
                  <p>{valuation.explanation.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
