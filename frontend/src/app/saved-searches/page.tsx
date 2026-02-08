"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Search, 
  Bell, 
  BellOff, 
  Trash2, 
  Play,
  MapPin,
  Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getSavedSearches, 
  deleteSavedSearch, 
  toggleSavedSearchAlerts,
  SavedSearch 
} from "@/lib/savedSearchesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SavedSearchesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // API state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedSearches = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getSavedSearches();
        setSavedSearches(data);
      } catch (err) {
        console.error("Failed to fetch saved searches:", err);
        setError("Nu am putut încărca căutările salvate");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchSavedSearches();
    }
  }, [isAuthenticated, isAuthLoading]);

  const handleDelete = async (id: number) => {
    try {
      await deleteSavedSearch(id);
      setSavedSearches(savedSearches.filter(s => s.id !== id));
      toast.success("Căutare ștearsă");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Nu am putut șterge căutarea");
    }
  };

  const handleToggleAlerts = async (search: SavedSearch) => {
    try {
      const updated = await toggleSavedSearchAlerts(
        search.id, 
        !search.alertsEnabled,
        'DAILY'
      );
      setSavedSearches(savedSearches.map(s => 
        s.id === search.id ? updated : s
      ));
      toast.success(updated.alertsEnabled ? "Alerte activate" : "Alerte dezactivate");
    } catch (err) {
      console.error("Failed to toggle alerts:", err);
      toast.error("Nu am putut actualiza alertele");
    }
  };

  const formatSearchParams = (params: SavedSearch['params']) => {
    const parts: string[] = [];
    
    if (params.city) parts.push(params.city);
    if (params.rooms) parts.push(`${params.rooms} camere`);
    if (params.priceMin || params.priceMax) {
      if (params.priceMin && params.priceMax) {
        parts.push(`${params.priceMin}-${params.priceMax}€`);
      } else if (params.priceMax) {
        parts.push(`până la ${params.priceMax}€`);
      } else {
        parts.push(`de la ${params.priceMin}€`);
      }
    }
    
    return parts.join(" • ") || "Toate proprietățile";
  };

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
          <Search className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea căutările salvate.
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
          <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Căutări salvate</h1>
          <Button asChild>
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Căutare nouă
            </Link>
          </Button>
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
        ) : savedSearches.length > 0 ? (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{search.name}</h3>
                      {search.newMatchesCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                          {search.newMatchesCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {formatSearchParams(search.params)}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Home className="h-3.5 w-3.5" />
                      {search.totalMatchesCount} proprietăți găsite
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlerts(search)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        search.alertsEnabled 
                          ? "bg-primary/10 text-primary hover:bg-primary/20" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      title={search.alertsEnabled ? "Dezactivează alertele" : "Activează alertele"}
                    >
                      {search.alertsEnabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </button>
                    
                    <Link
                      href={`/search?savedSearchId=${search.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors hover:bg-accent/20"
                      title="Rulează căutarea"
                    >
                      <Play className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                      title="Șterge căutarea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Search className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Nicio căutare salvată</h2>
            <p className="mt-2 text-muted-foreground">
              Salvează căutările tale pentru a primi alerte când apar proprietăți noi.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Începe o căutare</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
