"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Loader2, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getViewings, Viewing, ViewingStatus } from "@/lib/viewingsApi";
import { formatDistanceToNow, format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusConfig: Record<ViewingStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "În așteptare", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  CONFIRMED: { label: "Confirmat", color: "bg-green-100 text-green-800", icon: CheckCircle },
  REJECTED: { label: "Respins", color: "bg-red-100 text-red-800", icon: XCircle },
  CANCELLED: { label: "Anulat", color: "bg-gray-100 text-gray-800", icon: XCircle },
  COMPLETED: { label: "Finalizat", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
};

export default function ViewingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // API state
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ViewingStatus | 'all'>('all');

  useEffect(() => {
    const fetchViewings = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = filter !== 'all' ? { status: filter } : undefined;
        const data = await getViewings(params);
        setViewings(data);
      } catch (err) {
        console.error("Failed to fetch viewings:", err);
        setError("Nu am putut încărca vizionările");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchViewings();
    }
  }, [isAuthenticated, isAuthLoading, filter]);

  if (isAuthLoading) {
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
          <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea vizionările programate.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vizionări programate</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toate
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('PENDING')}
            >
              În așteptare
            </Button>
            <Button
              variant={filter === 'CONFIRMED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('CONFIRMED')}
            >
              Confirmate
            </Button>
            <Button
              variant={filter === 'COMPLETED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('COMPLETED')}
            >
              Finalizate
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Încearcă din nou
            </Button>
          </div>
        ) : viewings.length > 0 ? (
          <div className="space-y-4">
            {viewings.map((viewing) => {
              const status = statusConfig[viewing.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={viewing.id}
                  className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-4">
                    {/* Property Image */}
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {viewing.property.image ? (
                        <img
                          src={viewing.property.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/property/${viewing.property.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {viewing.property.title}
                          </Link>
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {viewing.property.address}, {viewing.property.city}
                          </div>
                        </div>
                        <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", status.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(viewing.scheduledAt), "d MMMM yyyy", { locale: ro })}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(viewing.scheduledAt), "HH:mm", { locale: ro })}
                        </div>
                        <span className="text-muted-foreground">
                          ({formatDistanceToNow(new Date(viewing.scheduledAt), { addSuffix: true, locale: ro })})
                        </span>
                      </div>

                      {viewing.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Note: {viewing.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Nicio vizionare programată</h2>
            <p className="mt-2 text-muted-foreground">
              Programează vizionări pentru proprietățile care te interesează.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Explorează proprietăți</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
