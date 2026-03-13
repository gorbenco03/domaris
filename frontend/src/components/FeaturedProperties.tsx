"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "./PropertyCard";
import { Sparkles, Clock, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchProperties, PropertyListing, getPropertyPrice, getPropertySurface, getPropertyMainImage, getPropertyLocation } from "@/lib/propertiesApi";

type FilterType = "recent" | "sale" | "rent";

interface FilterChipProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const FilterChip = ({ icon, label, isActive, onClick }: FilterChipProps) => (
  <button
    onClick={onClick}
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
  const [activeFilter, setActiveFilter] = useState<FilterType>("recent");

  const { data: properties = [], isLoading } = useQuery<PropertyListing[]>({
    queryKey: ['featured-properties', activeFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        limit: 6,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };
      if (activeFilter === "sale") params.transactionType = "sale";
      else if (activeFilter === "rent") params.transactionType = "rent";
      const response = await searchProperties(params as any);
      return response.data || [];
    },
  });

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
          <FilterChip
            icon={<Clock className="h-4 w-4" />}
            label="Cele mai noi"
            isActive={activeFilter === "recent"}
            onClick={() => setActiveFilter("recent")}
          />
          <FilterChip
            icon={<Sparkles className="h-4 w-4" />}
            label="De vânzare"
            isActive={activeFilter === "sale"}
            onClick={() => setActiveFilter("sale")}
          />
          <FilterChip
            icon={<TrendingDown className="h-4 w-4" />}
            label="De închiriat"
            isActive={activeFilter === "rent"}
            onClick={() => setActiveFilter("rent")}
          />
        </div>
      </div>

      {/* Property Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card overflow-hidden">
              <div className="aspect-[16/10] bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-24 rounded bg-muted" />
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="flex gap-4 pt-3 border-t border-border">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-4 w-12 rounded bg-muted" />
                  <div className="h-4 w-14 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              image={getPropertyMainImage(property)}
              price={`${getPropertyPrice(property).toLocaleString()} €`}
              priceType={property.transactionType === "RENT" ? "rent" : "sale"}
              title={property.title}
              location={getPropertyLocation(property)}
              rooms={property.rooms}
              baths={property.bathrooms || 1}
              area={getPropertySurface(property)}
              tags={[property.transactionType === "RENT" ? "De închiriat" : "De vânzare"]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">Nu sunt proprietăți disponibile momentan.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/add-property">Adaugă prima proprietate</Link>
          </Button>
        </div>
      )}

      {/* Load More */}
      {properties.length > 0 && (
        <div className="mt-10 text-center">
          <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
            <Link href="/search">
              Vezi toate proprietățile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
};
