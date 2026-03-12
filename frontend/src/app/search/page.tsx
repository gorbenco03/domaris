"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Bookmark,
  MapPin,
  Tag,
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
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PropertyTypeFilters, PropertyType, SearchFilters, emptyFilters } from "@/components/search/PropertyTypeFilters";
import { QuickFilters, QuickFilterId } from "@/components/search/FilterChips";
import { searchProperties, PropertyListing, PropertySearchParams } from "@/lib/propertiesApi";
import { getSearchSuggestions, SearchSuggestion, getMapData, MapProperty } from "@/lib/searchApi";
import { createSavedSearch } from "@/lib/savedSearchesApi";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const propertyTypeTabs = [
  { id: "apartments" as PropertyType, label: "Apartamente", icon: Building2 },
  { id: "houses" as PropertyType, label: "Case", icon: Home },
  { id: "commercial" as PropertyType, label: "Comercial", icon: Store },
  { id: "land" as PropertyType, label: "Terenuri", icon: Mountain },
];

const propertyTypeMap: Record<PropertyType, string> = {
  apartments: "APARTMENT",
  houses: "HOUSE",
  commercial: "COMMERCIAL",
  land: "LAND",
};

const urlTypeMap: Record<string, PropertyType> = {
  apartment: "apartments",
  house: "houses",
  commercial: "commercial",
  land: "land",
};

// Convert SearchFilters to PropertySearchParams
function filtersToParams(filters: SearchFilters): Partial<PropertySearchParams> {
  const params: Partial<PropertySearchParams> = {};
  if (filters.transactionType) params.transactionType = filters.transactionType as 'sale' | 'rent';
  if (filters.minPrice) params.minPrice = Number(filters.minPrice);
  if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
  if (filters.minRooms) params.minRooms = Number(filters.minRooms);
  if (filters.maxRooms) params.maxRooms = Number(filters.maxRooms);
  if (filters.minBathrooms) params.minBathrooms = Number(filters.minBathrooms);
  if (filters.maxBathrooms) params.maxBathrooms = Number(filters.maxBathrooms);
  if (filters.minSurface) params.minSurface = Number(filters.minSurface);
  if (filters.maxSurface) params.maxSurface = Number(filters.maxSurface);
  if (filters.minFloor) params.minFloor = Number(filters.minFloor);
  if (filters.maxFloor) params.maxFloor = Number(filters.maxFloor);
  if (filters.minYear) params.minYear = Number(filters.minYear);
  if (filters.maxYear) params.maxYear = Number(filters.maxYear);
  if (filters.city) params.city = filters.city;
  if (filters.neighborhood) params.neighborhood = filters.neighborhood;
  if (filters.isFurnished) params.isFurnished = true;
  if (filters.hasCentralHeating) params.hasCentralHeating = true;
  if (filters.hasParking) params.hasParking = true;
  if (filters.hasBalcony) params.hasBalcony = true;
  if (filters.hasElevator) params.hasElevator = true;
  if (filters.hasAC) params.hasAC = true;
  if (filters.hasStorage) params.hasStorage = true;
  if (filters.hasGarden) params.hasGarden = true;
  return params;
}

// Sync filters to URL search params
function filtersToUrl(filters: SearchFilters, propertyType: PropertyType, sortBy: string): string {
  const params = new URLSearchParams();
  const typeKey = Object.entries(urlTypeMap).find(([, v]) => v === propertyType)?.[0];
  if (typeKey) params.set("type", typeKey);
  if (sortBy !== "relevance") params.set("sort", sortBy);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== false) {
      params.set(key, String(value));
    }
  });
  const q = params.toString();
  return q ? `?${q}` : "";
}

// Parse URL search params to filters
function urlToFilters(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  const stringKeys: (keyof SearchFilters)[] = [
    "transactionType", "minPrice", "maxPrice", "minRooms", "maxRooms",
    "minBathrooms", "maxBathrooms", "minSurface", "maxSurface",
    "minFloor", "maxFloor", "minYear", "maxYear", "city", "neighborhood",
  ];
  const boolKeys: (keyof SearchFilters)[] = [
    "isFurnished", "hasCentralHeating", "hasParking", "hasBalcony",
    "hasElevator", "hasAC", "hasStorage", "hasGarden",
  ];
  stringKeys.forEach((key) => {
    const val = searchParams.get(key);
    if (val) (filters as Record<string, unknown>)[key] = val;
  });
  boolKeys.forEach((key) => {
    if (searchParams.get(key) === "true") (filters as Record<string, unknown>)[key] = true;
  });
  return filters;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [propertyType, setPropertyType] = useState<PropertyType>(() => {
    const typeParam = searchParams.get("type");
    return (typeParam && urlTypeMap[typeParam]) || "apartments";
  });

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>(() => urlToFilters(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(() => urlToFilters(searchParams));

  // API state
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Map state
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saved search dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Quick filters state
  const [quickFilters, setQuickFilters] = useState<QuickFilterId[]>([]);

  const handleQuickFilterToggle = (id: QuickFilterId) => {
    setQuickFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch properties (initial or filter change)
  const fetchProperties = useCallback(async (resetPage = true) => {
    if (resetPage) {
      setIsLoading(true);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const currentPage = resetPage ? 1 : page;
      const params: PropertySearchParams = {
        propertyType: propertyTypeMap[propertyType],
        limit,
        page: currentPage,
        ...filtersToParams(appliedFilters),
      };

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

      if (resetPage) {
        setProperties(response.data);
      } else {
        setProperties(prev => [...prev, ...response.data]);
      }
      setTotal(response.total);
      setHasMore(currentPage * limit < response.total);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      if (resetPage) {
        setProperties([]);
        setTotal(0);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [propertyType, sortBy, appliedFilters, page]);

  // Initial fetch and on filter/sort/type change
  useEffect(() => {
    fetchProperties(true);
  }, [propertyType, sortBy, appliedFilters]);

  // Fetch map data when in map mode
  useEffect(() => {
    if (viewMode !== "map") return;

    const fetchMapData = async () => {
      setIsMapLoading(true);
      try {
        const params = {
          propertyType: propertyTypeMap[propertyType],
          ...filtersToParams(appliedFilters),
        };
        const data = await getMapData(params);
        setMapProperties(data);
      } catch (error) {
        console.error("Failed to fetch map data:", error);
        setMapProperties([]);
      } finally {
        setIsMapLoading(false);
      }
    };

    fetchMapData();
  }, [viewMode, propertyType, appliedFilters]);

  // Infinite scroll observer
  useEffect(() => {
    if (viewMode !== "list" || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, viewMode]);

  // Load more when page changes (for infinite scroll)
  useEffect(() => {
    if (page > 1) {
      fetchProperties(false);
    }
  }, [page]);

  // Autocomplete debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const url = `/search${filtersToUrl(appliedFilters, propertyType, sortBy)}`;
    router.replace(url, { scroll: false });
  }, [appliedFilters, propertyType, sortBy]);

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  // Handle autocomplete selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setIsSearchOpen(false);
    setSearchQuery(suggestion.label);

    const newFilters = { ...filters };
    if (suggestion.type === "city") {
      newFilters.city = suggestion.value;
      delete newFilters.neighborhood;
    } else if (suggestion.type === "neighborhood") {
      newFilters.neighborhood = suggestion.value;
    }
    setFilters(newFilters);
    setAppliedFilters(newFilters);
  };

  // Save search handler
  const handleSaveSearch = async () => {
    if (!savedSearchName.trim()) return;
    setIsSaving(true);
    try {
      await createSavedSearch({
        name: savedSearchName.trim(),
        params: {
          propertyType: propertyTypeMap[propertyType],
          transactionType: appliedFilters.transactionType as 'RENT' | 'SALE' | undefined,
          priceMin: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
          priceMax: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
          roomsMin: appliedFilters.minRooms ? Number(appliedFilters.minRooms) : undefined,
          roomsMax: appliedFilters.maxRooms ? Number(appliedFilters.maxRooms) : undefined,
          surfaceMin: appliedFilters.minSurface ? Number(appliedFilters.minSurface) : undefined,
          surfaceMax: appliedFilters.maxSurface ? Number(appliedFilters.maxSurface) : undefined,
          city: appliedFilters.city,
          isFurnished: appliedFilters.isFurnished,
        },
        alertsEnabled: true,
        alertFrequency: "DAILY",
      });
      setShowSaveDialog(false);
      setSavedSearchName("");
    } catch (error) {
      console.error("Failed to save search:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPropertyTypeLabel = () => {
    const tab = propertyTypeTabs.find((t) => t.id === propertyType);
    return tab?.label || "Proprietăți";
  };

  const activeFilterCount = Object.keys(appliedFilters).length;

  // Map properties for PropertyMap component
  const mapDisplayProperties = viewMode === "map"
    ? (mapProperties.length > 0 ? mapProperties : properties).map(p => ({
        id: 'id' in p ? (p as PropertyListing).id : (p as MapProperty).id,
        title: 'title' in p ? (p as PropertyListing).title : `${(p as MapProperty).rooms} camere`,
        price: `${(('priceEur' in p ? p.priceEur : 0) ?? 0).toLocaleString()} €`,
        location: 'city' in p ? `${(p as PropertyListing).neighborhood || ""}, ${(p as PropertyListing).city}` : "",
        lat: p.lat || 44.4268,
        lng: p.lng || 26.1025,
        image: 'images' in p ? ((p as PropertyListing).images?.[0]?.url || "") : "",
        rooms: p.rooms,
        baths: 'bathrooms' in p ? ((p as PropertyListing).bathrooms || 1) : 1,
        area: 'surfaceSqm' in p ? (p as PropertyListing).surfaceSqm : 0,
        priceType: (p.transactionType === "RENT" ? "rent" : "sale") as "rent" | "sale",
      }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {getPropertyTypeLabel()}
            </h1>

            {/* Search Autocomplete - Desktop */}
            <div className="hidden md:flex relative max-w-xs">
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Caută oraș, cartier..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) setIsSearchOpen(true);
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0) setIsSearchOpen(true);
                      }}
                      className="h-9 w-64 rounded-lg pl-9 pr-3 text-sm bg-muted/50 border-transparent focus:border-primary focus:bg-background"
                    />
                  </div>
                </PopoverTrigger>
                {suggestions.length > 0 && (
                  <PopoverContent className="w-64 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Command>
                      <CommandList>
                        {/* Cities */}
                        {suggestions.filter(s => s.type === "city").length > 0 && (
                          <CommandGroup heading="Orașe">
                            {suggestions.filter(s => s.type === "city").map((s) => (
                              <CommandItem key={`city-${s.value}`} onSelect={() => handleSuggestionSelect(s)}>
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{s.label}</span>
                                {s.count !== undefined && (
                                  <span className="ml-auto text-xs text-muted-foreground">{s.count}</span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {/* Neighborhoods */}
                        {suggestions.filter(s => s.type === "neighborhood").length > 0 && (
                          <CommandGroup heading="Cartiere">
                            {suggestions.filter(s => s.type === "neighborhood").map((s) => (
                              <CommandItem key={`nb-${s.value}`} onSelect={() => handleSuggestionSelect(s)}>
                                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{s.label}</span>
                                {s.count !== undefined && (
                                  <span className="ml-auto text-xs text-muted-foreground">{s.count}</span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
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
                Filtre{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtre {getPropertyTypeLabel()}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 pb-6">
                <PropertyTypeFilters
                  propertyType={propertyType}
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                  onApply={handleApplyFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Quick Filters */}
          <div className="mt-4">
            <QuickFilters selected={quickFilters} onToggle={handleQuickFilterToggle} />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          {viewMode === "list" && (
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Filtre {getPropertyTypeLabel()}
                </h3>
                <PropertyTypeFilters
                  propertyType={propertyType}
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                  onApply={handleApplyFilters}
                />
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{total}</span> {getPropertyTypeLabel().toLowerCase()}
                </p>

                {/* Active filter indicators */}
                {appliedFilters.city && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <MapPin className="mr-1 h-3 w-3" />
                    {appliedFilters.city}
                    <button
                      onClick={() => {
                        const next = { ...appliedFilters };
                        delete next.city;
                        delete next.neighborhood;
                        setFilters(next);
                        setAppliedFilters(next);
                      }}
                      className="ml-1 hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Save Search Button */}
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    title="Salvează căutarea"
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Salvează</span>
                  </Button>
                )}

                {/* Saved Searches Link */}
                {isAuthenticated && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/saved-searches">
                      <Bookmark className="mr-1 h-4 w-4 fill-current" />
                      <span className="hidden sm:inline">Căutări salvate</span>
                    </Link>
                  </Button>
                )}

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
                <>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        id={property.id}
                        image={property.images?.[0]?.url || ""}
                        price={`${(property.priceEur ?? 0).toLocaleString()} €`}
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

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} className="h-4" />

                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Se încarcă mai multe...</span>
                    </div>
                  )}

                  {/* Load more fallback button */}
                  {hasMore && !isLoadingMore && (
                    <div className="flex justify-center py-6">
                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => prev + 1)}
                      >
                        Încarcă mai multe
                      </Button>
                    </div>
                  )}

                  {/* End of results */}
                  {!hasMore && properties.length > 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Ai văzut toate cele {total} rezultate
                    </p>
                  )}
                </>
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
                  {activeFilterCount > 0 && (
                    <Button variant="outline" className="mt-4" onClick={handleResetFilters}>
                      Resetează filtrele
                    </Button>
                  )}
                </div>
              )
            ) : (
              <div className={cn(
                "rounded-2xl border border-border overflow-hidden",
                "h-[calc(100vh-14rem)]"
              )}>
                {isMapLoading ? (
                  <div className="flex h-full items-center justify-center bg-muted/30">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : (
                  <PropertyMap
                    properties={mapDisplayProperties}
                    onViewDetails={(id) => {
                      window.open(`/property/${id}`, '_blank');
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvează căutarea</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Numele căutării
            </label>
            <Input
              placeholder="ex. Apartamente 2 camere, Chișinău"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Vei primi notificări zilnice când apar proprietăți noi care corespund criteriilor.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleSaveSearch} disabled={!savedSearchName.trim() || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
