"use client";

import { PropertyCard } from "./PropertyCard";
import { Sparkles, Clock, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockProperties = [
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
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
    price: "203.910 €",
    priceType: "sale" as const,
    title: "Spațiu 5 camere - Tineretului",
    location: "Strada Tineretului nr. 28, București",
    rooms: 5,
    baths: 2,
    area: 142,
    tags: ["De vânzare"],
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
    price: "185.000 €",
    priceType: "sale" as const,
    title: "Apartament modern 3 camere",
    location: "Floreasca, București",
    rooms: 3,
    baths: 1,
    area: 85,
    isFavorite: true,
    tags: ["De vânzare"],
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
    price: "890 €",
    priceType: "rent" as const,
    title: "Penthouse cu terasă",
    location: "Aviatorilor, București",
    rooms: 2,
    baths: 1,
    area: 95,
    tags: ["De închiriat"],
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop",
    price: "320.000 €",
    priceType: "sale" as const,
    title: "Vilă cu grădină - Pipera",
    location: "Pipera, București",
    rooms: 4,
    baths: 3,
    area: 220,
    tags: ["De vânzare"],
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&auto=format&fit=crop",
    price: "1.200 €",
    priceType: "rent" as const,
    title: "Loft industrial renovat",
    location: "Centru Vechi, București",
    rooms: 2,
    baths: 1,
    area: 110,
    tags: ["De închiriat"],
  },
];

interface FilterChipProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const FilterChip = ({ icon, label, isActive }: FilterChipProps) => (
  <button
    className={cn(
      "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
      isActive
        ? "border-accent bg-accent text-accent-foreground"
        : "border-border bg-card text-foreground hover:border-accent hover:bg-accent/5"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const FeaturedProperties = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
            Proprietăți recomandate
          </h2>
          <p className="mt-1 text-muted-foreground">
            Cele mai noi și populare anunțuri
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <FilterChip icon={<Sparkles className="h-4 w-4" />} label="Recomandate AI" isActive />
          <FilterChip icon={<Clock className="h-4 w-4" />} label="Noi (7 zile)" />
          <FilterChip icon={<TrendingDown className="h-4 w-4" />} label="Preț redus" />
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockProperties.map((property) => (
          <PropertyCard key={property.id} {...property} />
        ))}
      </div>

      {/* Load More */}
      <div className="mt-10 text-center">
        <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
          <Link href="/search">
            Vezi toate proprietățile
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
