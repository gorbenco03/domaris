"use client";

import { useState } from "react";
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
    lat: 44.4134,
    lng: 26.0271,
    propertyType: "apartments" as PropertyType,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
    price: "203.910 €",
    priceType: "sale" as const,
    title: "Spațiu comercial - Tineretului",
    location: "Strada Tineretului nr. 28, București",
    rooms: 5,
    baths: 2,
    area: 142,
    tags: ["De vânzare"],
    lat: 44.4076,
    lng: 26.1063,
    propertyType: "commercial" as PropertyType,
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
    lat: 44.4671,
    lng: 26.0955,
    propertyType: "apartments" as PropertyType,
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
    lat: 44.4612,
    lng: 26.0803,
    propertyType: "apartments" as PropertyType,
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
    lat: 44.4909,
    lng: 26.1148,
    propertyType: "houses" as PropertyType,
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&auto=format&fit=crop",
    price: "1.200 €",
    priceType: "rent" as const,
    title: "Casă de vacanță",
    location: "Snagov, Ilfov",
    rooms: 3,
    baths: 2,
    area: 150,
    tags: ["De închiriat"],
    lat: 44.6923,
    lng: 26.1485,
    propertyType: "houses" as PropertyType,
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
    price: "450.000 €",
    priceType: "sale" as const,
    title: "Spațiu birouri clasa A",
    location: "Piața Victoriei, București",
    rooms: 8,
    baths: 2,
    area: 350,
    tags: ["De vânzare"],
    lat: 44.4525,
    lng: 26.0857,
    propertyType: "commercial" as PropertyType,
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop",
    price: "85.000 €",
    priceType: "sale" as const,
    title: "Teren intravilan 1000mp",
    location: "Bragadiru, Ilfov",
    rooms: 0,
    baths: 0,
    area: 1000,
    tags: ["De vânzare"],
    lat: 44.3672,
    lng: 25.9756,
    propertyType: "land" as PropertyType,
  },
];

const propertyTypeTabs = [
  { id: "apartments" as PropertyType, label: "Apartamente", icon: Building2 },
  { id: "houses" as PropertyType, label: "Case", icon: Home },
  { id: "commercial" as PropertyType, label: "Comercial", icon: Store },
  { id: "land" as PropertyType, label: "Terenuri", icon: Mountain },
];

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState("relevance");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartments");

  // Filter properties based on selected type
  const filteredProperties = mockProperties.filter(
    (p) => p.propertyType === propertyType
  );

  const getPropertyTypeLabel = () => {
    const tab = propertyTypeTabs.find((t) => t.id === propertyType);
    return tab?.label || "Proprietăți";
  };

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
                <span className="font-semibold text-foreground">{filteredProperties.length}</span> {getPropertyTypeLabel().toLowerCase()}
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

            {/* Results Grid / Map */}
            {viewMode === "list" ? (
              filteredProperties.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} {...property} />
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
                  properties={filteredProperties.map(p => ({
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    location: p.location,
                    lat: p.lat,
                    lng: p.lng,
                    image: p.image,
                    rooms: p.rooms,
                    baths: p.baths,
                    area: p.area,
                    priceType: p.priceType,
                  }))}
                  onViewDetails={(id) => {
                    window.open(`/property/${id}`, '_blank');
                  }}
                />
              </div>
            )}

            {/* Pagination - only show if there are results */}
            {filteredProperties.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    3
                  </Button>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button variant="outline" size="sm">
                    10
                  </Button>
                  <Button variant="outline" size="sm">
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
