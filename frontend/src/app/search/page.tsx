"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  List,
  Map as MapIcon,
  ArrowUpDown,
  Building2,
  Home,
  Store,
  Mountain,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PropertyTypeFilters, PropertyType } from "@/components/search/PropertyTypeFilters";
import { searchProperties, PropertyListing, PropertySearchParams } from "@/lib/propertiesApi";

const propertyTypeTabs = [
  { id: "apartments" as PropertyType, label: "Apartamente", icon: Building2 },
  { id: "houses" as PropertyType, label: "Case", icon: Home },
  { id: "commercial" as PropertyType, label: "Comercial", icon: Store },
  { id: "land" as PropertyType, label: "Terenuri", icon: Mountain },
];

// Map UI property types to backend types
const propertyTypeMap: Record<PropertyType, string> = {
  apartments: "APARTMENT",
  houses: "HOUSE",
  commercial: "COMMERCIAL",
  land: "LAND",
};

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState("relevance");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartments");
  
  // API state
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params: PropertySearchParams = {
        propertyType: propertyTypeMap[propertyType],
        limit,
        page,
      };
      
      // Map sort options
      if (sortBy === "newest") {
        params.sortBy = "createdAt";
        params.sortOrder = "DESC";
      } else if (sortBy === "price-asc") {
        params.sortBy = "price";
        params.sortOrder = "ASC";
      } else if (sortBy === "price-desc") {
        params.sortBy = "price";
        params.sortOrder = "DESC";
      }
      
      const response = await searchProperties(params);
      setProperties(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [propertyType, sortBy, page]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [propertyType, sortBy]);

  const getPropertyTypeLabel = () => {
    const tab = propertyTypeTabs.find((t) => t.id === propertyType);
    return tab?.label || "Proprietăți";
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Property Type Tabs - Clean Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {getPropertyTypeLabel()}
            </h1>
            
            {/* Compact Search - Desktop */}
            <div className="hidden md:flex relative max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Caută..."
                className="h-9 rounded-lg pl-9 pr-3 text-sm bg-muted/50 border-transparent focus:border-primary focus:bg-background"
              />
            </div>
          </div>

          {/* Property Type Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
            {propertyTypeTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPropertyType(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    propertyType === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Button - Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full lg:hidden mt-4">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtre pentru {getPropertyTypeLabel()}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtre {getPropertyTypeLabel()}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 pb-6">
                <PropertyTypeFilters propertyType={propertyType} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Filtre {getPropertyTypeLabel()}
              </h3>
              <PropertyTypeFilters propertyType={propertyType} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total}</span> {getPropertyTypeLabel().toLowerCase()}
              </p>

              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevanță</SelectItem>
                    <SelectItem value="newest">Cele mai noi</SelectItem>
                    <SelectItem value="price-asc">Preț crescător</SelectItem>
                    <SelectItem value="price-desc">Preț descrescător</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex rounded-lg border border-border">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex items-center gap-2 rounded-l-lg px-3 py-2 text-sm transition-colors",
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={cn(
                      "flex items-center gap-2 rounded-r-lg px-3 py-2 text-sm transition-colors",
                      viewMode === "map"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    <MapIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : viewMode === "list" ? (
              properties.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <SearchIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    Nu am găsit {getPropertyTypeLabel().toLowerCase()}
                  </h3>
                  <p className="text-muted-foreground">
                    Încearcă să modifici filtrele sau să cauți în altă zonă.
                  </p>
                </div>
              )
            ) : (
              <div className="h-[600px] rounded-2xl border border-border overflow-hidden">
                <PropertyMap 
                  properties={properties.map(p => ({
                    id: p.id,
                    title: p.title,
                    price: `${p.priceEur.toLocaleString()} €`,
                    location: `${p.neighborhood || ""}, ${p.city}`,
                    lat: p.lat || 44.4268,
                    lng: p.lng || 26.1025,
                    image: p.images?.[0]?.url || "",
                    rooms: p.rooms,
                    baths: p.bathrooms || 1,
                    area: p.surfaceSqm,
                    priceType: p.transactionType === "RENT" ? "rent" as const : "sale" as const,
                  }))}
                  onViewDetails={(id) => {
                    window.open(`/property/${id}`, '_blank');
                  }}
                />
              </div>
            )}

            {/* Pagination */}
            {properties.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          page === pageNum && "bg-primary text-primary-foreground"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Următor
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
