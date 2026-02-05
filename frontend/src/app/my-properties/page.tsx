"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Home, Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const mockMyProperties = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
    price: "564 €",
    priceType: "rent" as const,
    title: "Apartament 1 cameră - Drumul Taberei",
    location: "Drumul Taberei, București",
    rooms: 1,
    baths: 1,
    area: 51,
    tags: ["De închiriat"],
  },
];

export default function MyPropertiesPage() {
  const { isAuthenticated } = useAuth();

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
              {mockMyProperties.length} anunțuri active
            </p>
          </div>
          <Button asChild>
            <Link href="/add-property">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă anunț
            </Link>
          </Button>
        </div>

        {mockMyProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockMyProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
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
