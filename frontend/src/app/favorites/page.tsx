"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFavorites, FavoriteItem } from "@/lib/favoritesApi";

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // API state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getFavorites();
        setFavorites(response.data);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        setError("Nu am putut încărca favoritele tale");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchFavorites();
    }
  }, [isAuthenticated, isAuthLoading]);

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
          <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea favoritele.
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
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Favorite</h1>
        <p className="mb-8 text-muted-foreground">
          {favorites.length} proprietăți salvate
        </p>

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
        ) : favorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <PropertyCard
                key={fav.id}
                id={fav.property?.id || fav.propertyId}
                image={fav.property?.image || ""}
                price={`${fav.property?.price?.toLocaleString() || 0} €`}
                priceType="sale"
                title={fav.property?.title || "Property"}
                location={`${fav.property?.address || ""}, ${fav.property?.city || ""}`}
                rooms={fav.property?.rooms || 0}
                baths={1}
                area={fav.property?.surface || fav.property?.area || 0}
                tags={["Favorit"]}
                isFavorite={true}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Niciun favorit încă</h2>
            <p className="mt-2 text-muted-foreground">
              Salvează proprietățile care îți plac pentru a le regăsi ușor.
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
