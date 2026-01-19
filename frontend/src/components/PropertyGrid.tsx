"use client";

import { useState, useMemo } from "react";
import { PropertyCard } from "./PropertyCard";
import { SearchFilters } from "./SearchFilters";
import { useListings } from "@/hooks/useListings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PropertyGrid = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [propertyType, setPropertyType] = useState("all");

  // Convert filters to API format
  const apiFilters = useMemo(() => {
    const filters: Record<string, any> = {
      limit: 50,
      sortBy: 'postedAt',
      sortOrder: 'DESC',
    };

    // City/Neighborhood filter from search term
    if (searchTerm) {
      // Try to detect if it's a city or neighborhood
      // For now, we'll search in both city and neighborhood
      filters.city = searchTerm;
    }

    // Price range filter
    if (priceRange !== "all") {
      if (priceRange === "0-2000") {
        filters.minPrice = 0;
        filters.maxPrice = 2000;
      } else if (priceRange === "2000-3000") {
        filters.minPrice = 2000;
        filters.maxPrice = 3000;
      } else if (priceRange === "3000-5000") {
        filters.minPrice = 3000;
        filters.maxPrice = 5000;
      } else if (priceRange === "5000+") {
        filters.minPrice = 5000;
      }
    }

    // Bedrooms filter
    if (bedrooms !== "all") {
      if (bedrooms === "4+") {
        filters.minRooms = 4;
      } else {
        const rooms = parseInt(bedrooms);
        filters.minRooms = rooms;
        filters.maxRooms = rooms;
      }
    }

    // Property type filter (not directly supported by API, but we can filter client-side)
    // For now, we'll just fetch all and filter client-side if needed

    return filters;
  }, [searchTerm, priceRange, bedrooms, propertyType]);

  const { listings, loading, error, pagination } = useListings(apiFilters);

  // Client-side filtering for property type (if needed)
  const filteredListings = useMemo(() => {
    if (propertyType === "all") {
      return listings;
    }
    // Since API doesn't have property type, we'll show all for now
    // This can be enhanced later if property type is added to the API
    return listings;
  }, [listings, propertyType]);

  return (
    <section id="properties" className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Properties
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our hand-picked selection of premium rental properties
          </p>
        </div>

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          propertyType={propertyType}
          setPropertyType={setPropertyType}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : filteredListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
            {pagination && (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Showing {filteredListings.length} of {pagination.total} properties
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No properties found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
