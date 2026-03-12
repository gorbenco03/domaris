"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPropertyDetail, getPropertyAnalytics, PropertyListing } from "@/lib/propertiesApi";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Period = "7d" | "30d" | "all";

interface AnalyticsData {
  views: number;
  favorites: number;
  messages: number;
  viewings: number;
  dailyViews: Array<{ date: string; count: number }>;
}

export default function PropertyAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !id) return;
      setIsLoading(true);
      setError(null);

      try {
        const [p, stats] = await Promise.all([
          getPropertyDetail(id),
          getPropertyAnalytics(id, period),
        ]);
        setProperty(p);
        setAnalytics(stats);
      } catch {
        setError("Nu am putut încărca statisticile.");
        toast.error("Eroare la încărcarea statisticilor.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchData();
    }
  }, [id, isAuthenticated, isAuthLoading, period]);

  if (isAuthLoading || (isLoading && !analytics)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Autentificare necesară</h1>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Încearcă din nou
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const statCards = [
    { label: "Vizualizări", value: analytics?.views ?? 0, icon: Eye, color: "text-blue-500" },
    { label: "Favorite", value: analytics?.favorites ?? 0, icon: Heart, color: "text-rose-500" },
    { label: "Mesaje", value: analytics?.messages ?? 0, icon: MessageCircle, color: "text-emerald-500" },
    { label: "Vizionări", value: analytics?.viewings ?? 0, icon: Calendar, color: "text-amber-500" },
  ];

  const chartData = (analytics?.dailyViews || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
    views: d.count,
  }));

  const periodLabels: Record<Period, string> = {
    "7d": "7 zile",
    "30d": "30 zile",
    all: "Tot timpul",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link
            href="/my-properties"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la proprietățile mele
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Statistici</h1>
          {property && (
            <p className="mt-1 text-muted-foreground">
              <Link href={`/property/${property.id}`} className="hover:underline">
                {property.title}
              </Link>
              {" · "}{property.city}
            </p>
          )}
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {(["7d", "30d", "all"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-muted p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Views Chart */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Vizualizări zilnice</h2>
          {chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Vizualizări"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#viewsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <p>Nu sunt date disponibile pentru această perioadă.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
