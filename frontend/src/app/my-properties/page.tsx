"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Home, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProperties, PropertyListing } from "@/lib/propertiesApi";

export default function MyPropertiesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // API state
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getMyProperties();
        setProperties(data);
      } catch (err) {
        console.error("Failed to fetch my properties:", err);
        setError("Nu am putut încărca proprietățile tale");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchProperties();
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
          <Home className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea proprietățile tale.
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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Proprietățile mele</h1>
            <p className="mt-1 text-muted-foreground">
              {properties.length} anunțuri active
            </p>
          </div>
          <Button asChild>
            <Link href="/add-property">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă anunț
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
        ) : properties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                image={property.images?.[0]?.url || ""}
                price={`${property.priceEur.toLocaleString()} €`}
                priceType={property.transactionType === "RENT" ? "rent" : "sale"}
                title={property.title}
                location={`${property.neighborhood || ""}, ${property.city}`}
                rooms={property.rooms}
                baths={property.bathrooms || 1}
                area={property.surfaceSqm}
                tags={property.transactionType === "RENT" ? ["De închiriat"] : ["De vânzare"]}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Home className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Nicio proprietate încă</h2>
            <p className="mt-2 text-muted-foreground">
              Adaugă prima ta proprietate pentru a începe.
            </p>
            <Button asChild className="mt-6">
              <Link href="/add-property">
                <Plus className="mr-2 h-4 w-4" />
                Adaugă proprietate
              </Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
