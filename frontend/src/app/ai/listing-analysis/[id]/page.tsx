"use client";

/**
 * RIVA Frontend - AI Listing Analysis Page
 * Dedicated page for AI-powered listing quality analysis
 * Aligned with mobile/src/features/ai/screens/ListingAnalysisScreen.tsx
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Camera,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Star,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getPropertyDetail, PropertyListing } from "@/lib/propertiesApi";
import { analyzeProperty, estimatePrice, PropertyAnalysis } from "@/lib/aiApi";

// ============================================
// HELPERS
// ============================================

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-orange-500";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-orange-500";
  return "bg-red-500";
}

function getImpactStyle(impact: string) {
  switch (impact) {
    case "high":
      return { color: "text-red-600", bg: "bg-red-500/10", label: "IMPACT MARE" };
    case "medium":
      return { color: "text-orange-500", bg: "bg-orange-500/10", label: "IMPACT MEDIU" };
    default:
      return { color: "text-blue-600", bg: "bg-blue-500/10", label: "IMPACT MIC" };
  }
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  title: FileText,
  description: FileText,
  photos: Camera,
  pricing: DollarSign,
};

// ============================================
// COMPONENT
// ============================================

export default function ListingAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<{
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (refresh = false) => {
    if (!id || !isAuthenticated) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const prop = await getPropertyDetail(id);
      setProperty(prop);

      const [analysisData, estimate] = await Promise.all([
        analyzeProperty(Number(id)).catch(() => null),
        estimatePrice({
          city: prop.city,
          propertyType: prop.propertyType,
          transactionType: prop.transactionType,
          rooms: prop.rooms,
          surfaceSqm: prop.surfaceSqm ?? 0,
        }).catch(() => null),
      ]);

      if (analysisData) setAnalysis(analysisData);
      if (estimate) setPriceEstimate(estimate);
    } catch {
      setError("Nu am putut încărca analiza.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) fetchData();
  }, [id, isAuthenticated, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Se generează analiza AI...</p>
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
          <Button asChild className="mt-6"><Link href="/my-properties">Înapoi</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const overallScore = analysis?.scores?.overall ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/my-properties`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Reanalizează
          </Button>
        </div>

        {/* Title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 p-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analiză AI</h1>
            <p className="text-sm text-muted-foreground">{property.title}</p>
          </div>
        </div>

        {analysis ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Scor general</p>
              <p className={cn("text-5xl font-bold", getScoreColor(overallScore))}>{overallScore}</p>
              <p className="text-sm text-muted-foreground mt-1">din 100</p>
              <Progress value={overallScore} className="mt-4 h-2" />
            </div>

            {/* Section Scores */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(["title", "description", "photos", "pricing"] as const).map((key) => {
                const score = analysis.scores[key] ?? 0;
                const Icon = SECTION_ICONS[key] || FileText;
                const labels: Record<string, string> = {
                  title: "Titlu",
                  description: "Descriere",
                  photos: "Fotografii",
                  pricing: "Preț",
                };
                return (
                  <div key={key} className="rounded-xl border border-border bg-card p-4 text-center">
                    <Icon className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
                    <p className={cn("text-2xl font-bold", getScoreColor(score))}>{score}</p>
                    <p className="text-xs text-muted-foreground">{labels[key]}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", getScoreBg(score))} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Check */}
            {analysis.priceCheck && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Verificare preț</h2>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Prețul tău</p>
                    <p className="text-lg font-bold">{(property.priceEur ?? 0).toLocaleString()} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sugerat</p>
                    <p className="text-lg font-bold text-primary">{(analysis.priceCheck.suggestedPrice ?? 0).toLocaleString()} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Media pieței</p>
                    <p className="text-lg font-bold">{(analysis.priceCheck.marketAverage ?? 0).toLocaleString()} €</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <span className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    analysis.priceCheck.status === "fair"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : analysis.priceCheck.status === "low"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-red-500/10 text-red-600"
                  )}>
                    {analysis.priceCheck.status === "fair" ? "Preț corect" : analysis.priceCheck.status === "low" ? "Sub piață" : "Peste piață"}
                  </span>
                </div>
              </div>
            )}

            {/* AI Price Estimate */}
            {priceEstimate && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold">Estimare automată de preț</h2>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Minim</p>
                    <p className="text-lg font-semibold">{priceEstimate.priceRange.min.toLocaleString()} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimat</p>
                    <p className="text-xl font-bold text-primary">{priceEstimate.estimatedPrice.toLocaleString()} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maxim</p>
                    <p className="text-lg font-semibold">{priceEstimate.priceRange.max.toLocaleString()} €</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Încredere: {Math.round(priceEstimate.confidence * 100)}%
                </p>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold">Recomandări</h2>
                </div>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {analysis.improvements.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Îmbunătățiri sugerate</h2>
                </div>
                <div className="space-y-3">
                  {analysis.improvements.map((imp, i) => {
                    const style = getImpactStyle(imp.impact);
                    return (
                      <div key={i} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{imp.field}</p>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", style.bg, style.color)}>
                            {style.label}
                          </span>
                        </div>
                        {imp.current && (
                          <p className="text-xs text-muted-foreground mb-1">
                            <span className="font-medium">Actual:</span> {imp.current}
                          </p>
                        )}
                        <p className="text-xs text-primary">
                          <span className="font-medium">Sugerat:</span> {imp.suggested}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Sparkles className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Analiza nu este disponibilă</h2>
            <p className="mt-2 text-muted-foreground">Nu am putut genera analiza pentru această proprietate.</p>
            <Button onClick={() => fetchData(true)} className="mt-6">
              <RefreshCw className="mr-2 h-4 w-4" />
              Încearcă din nou
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
